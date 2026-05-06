from __future__ import annotations

from collections import OrderedDict
from collections.abc import Callable

import frappe
from frappe.utils import cint, flt

from .constants import CASH_MODE_KEYWORD, SOURCE_COMPANY, TARGET_COMPANY

DUP_MARKER = "[DUP:{0}]"
ROUNDING_TOLERANCE = 0.01


class LiteOpsDuplicationError(Exception):
    pass


def on_pos_invoice_merge_log_submit(doc, method: str | None = None) -> None:
    """Duplicate the Sales Invoice created by ERPNext POS Closing.

    ERPNext stores the reliable cash/card split on the original POS Invoices,
    so this hook deliberately does not read Sales Invoice payments.
    """
    _duplicate_from_pos_invoice_merge_log(doc, f"POS Invoice Merge Log submit: {doc.name}")


def on_pos_invoice_merge_log_update_after_submit(doc, method: str | None = None) -> None:
    _duplicate_from_pos_invoice_merge_log(
        doc,
        f"POS Invoice Merge Log update after submit: {doc.name}",
    )


def on_pos_closing_entry_submit(doc, method: str | None = None) -> None:
    if doc.get("company") and doc.company != SOURCE_COMPANY:
        return

    merge_logs = frappe.get_all(
        "POS Invoice Merge Log",
        filters={"pos_closing_entry": doc.name, "docstatus": 1},
        fields=["name"],
        limit_page_length=0,
    )

    for row in merge_logs:
        merge_log = frappe.get_doc("POS Invoice Merge Log", row.name)
        _duplicate_from_pos_invoice_merge_log(
            merge_log,
            f"POS Closing Entry submit: {doc.name}",
        )


def on_sales_invoice_submit(doc, method: str | None = None) -> None:
    if not _is_supported_source_invoice(doc):
        return

    if not cint(doc.get("is_pos")):
        return

    pos_invoice_names = _get_pos_invoice_names(doc.name)
    if not pos_invoice_names:
        return

    if not _sales_invoice_is_fully_paid(doc):
        return

    _duplicate_safely(
        source=doc,
        payment_totals_factory=lambda: _payment_totals_from_pos_invoices(
            doc.name,
            pos_invoice_names=pos_invoice_names,
        ),
        context=f"Sales Invoice POS fallback submit: {doc.name}",
    )


def _duplicate_from_pos_invoice_merge_log(doc, context: str) -> None:
    if doc.get("company") and doc.company != SOURCE_COMPANY:
        return

    source_name = doc.get("consolidated_invoice")
    if not source_name:
        return

    source = frappe.get_doc("Sales Invoice", source_name)
    if not _is_supported_source_invoice(source):
        return

    if not cint(source.get("is_pos")):
        return

    if not _sales_invoice_is_fully_paid(source):
        return

    _duplicate_safely(
        source=source,
        payment_totals_factory=lambda: _payment_totals_from_pos_invoices(
            source.name,
            merge_log=doc,
        ),
        context=context,
    )


def on_payment_entry_submit(doc, method: str | None = None) -> None:
    if doc.company != SOURCE_COMPANY or doc.payment_type != "Receive":
        return

    seen: set[str] = set()
    for reference in doc.references:
        if reference.reference_doctype != "Sales Invoice" or not reference.reference_name:
            continue

        source_name = reference.reference_name
        if source_name in seen:
            continue
        seen.add(source_name)

        source = frappe.get_doc("Sales Invoice", source_name)
        if not _is_supported_source_invoice(source):
            continue

        try:
            payment_totals = _payment_totals_from_payment_entries(source.name)
        except LiteOpsDuplicationError:
            continue

        if _payment_total_amount(payment_totals) + ROUNDING_TOLERANCE < _invoice_payable_total(source):
            continue

        _duplicate_safely(
            source=source,
            payment_totals_factory=lambda payment_totals=payment_totals: payment_totals,
            context=f"Payment Entry submit: {doc.name}",
        )


@frappe.whitelist()
def retry_sales_invoice(source_name: str) -> dict:
    source = frappe.get_doc("Sales Invoice", source_name)
    if source.company != SOURCE_COMPANY:
        frappe.throw(f"Only {SOURCE_COMPANY} invoices can be duplicated.")
    if source.docstatus != 1:
        frappe.throw("Only submitted Sales Invoices can be duplicated.")
    if cint(source.get("is_return")):
        frappe.throw("Return invoices are not supported by this duplicate flow.")
    if not _sales_invoice_is_fully_paid(source):
        frappe.throw("Only fully paid Sales Invoices can be duplicated.")

    savepoint = f"lite_ops_dup_{frappe.generate_hash(length=8)}"
    frappe.db.savepoint(savepoint)

    try:
        duplicate = _duplicate_sales_invoice(source, _payment_totals_for_retry(source))
    except Exception:
        frappe.db.rollback(save_point=savepoint)
        frappe.log_error(
            title="Lite Ops manual invoice duplication failed",
            message=f"Manual retry\nSource: {source.name}\n\n{frappe.get_traceback()}",
        )
        frappe.throw("Clean Corp duplicate failed. Check Error Log for details.")

    if not duplicate:
        return {"created": False, "message": "Duplicate already exists."}

    return {"created": True, "name": duplicate}


def _duplicate_safely(
    source,
    payment_totals_factory: Callable[[], OrderedDict[str, float]],
    context: str,
) -> str | None:
    savepoint = f"lite_ops_dup_{frappe.generate_hash(length=8)}"
    frappe.db.savepoint(savepoint)

    try:
        return _duplicate_sales_invoice(source, payment_totals_factory())
    except Exception:
        frappe.db.rollback(save_point=savepoint)
        frappe.log_error(
            title="Lite Ops invoice duplication failed",
            message=f"{context}\nSource: {source.name}\n\n{frappe.get_traceback()}",
        )
        return None


def _duplicate_sales_invoice(source, payment_totals: OrderedDict[str, float]) -> str | None:
    if _already_duplicated(source.name):
        return None

    if not payment_totals:
        raise LiteOpsDuplicationError(f"No payment rows found for {source.name}.")

    has_cash = any(_is_cash_mode(mode) and flt(amount) > 0 for mode, amount in payment_totals.items())
    has_non_cash = any(
        not _is_cash_mode(mode) and flt(amount) > 0 for mode, amount in payment_totals.items()
    )

    if not has_cash and not has_non_cash:
        raise LiteOpsDuplicationError(f"No positive payments found for {source.name}.")

    cash_only = has_cash and not has_non_cash
    target = _get_target_company()
    source_abbr = frappe.db.get_value("Company", SOURCE_COMPANY, "abbr") or ""
    new_si = frappe.copy_doc(source)

    _prepare_duplicate_invoice(new_si, source, source_abbr, target)
    new_si.insert(ignore_permissions=True)

    if cash_only:
        return new_si.name

    new_si.submit()
    new_si.reload()
    payment_allocations = _get_payment_allocations(
        payment_totals,
        _invoice_amount_to_pay(new_si),
        target,
    )
    _create_payment_entries(new_si, payment_allocations, source)
    new_si.reload()
    if flt(new_si.get("outstanding_amount")) > ROUNDING_TOLERANCE:
        raise LiteOpsDuplicationError(
            f"Target invoice {new_si.name} still has {new_si.outstanding_amount} outstanding."
        )
    return new_si.name


def _prepare_duplicate_invoice(new_si, source, source_abbr: str, target) -> None:
    new_si.company = TARGET_COMPANY
    new_si.cost_center = target.cost_center
    new_si.debit_to = target.default_receivable_account
    new_si.set_posting_time = 1
    new_si.is_pos = 0
    new_si.docstatus = 0
    new_si.remarks = f"{DUP_MARKER.format(source.name)} Duplicated from {SOURCE_COMPANY}"

    _set_if_field(new_si, "payments", [])
    _set_if_field(new_si, "advances", [])
    _set_if_field(new_si, "payment_schedule", [])
    _set_if_field(new_si, "update_stock", 0)
    _set_if_field(new_si, "amended_from", None)
    _set_if_field(new_si, "return_against", None)
    _set_if_field(new_si, "inter_company_invoice_reference", None)
    _set_if_field(new_si, "is_consolidated", 0)
    _set_if_field(new_si, "pos_profile", None)
    _set_if_field(new_si, "taxes_and_charges", None)
    _set_if_field(new_si, "paid_amount", 0)
    _set_if_field(new_si, "base_paid_amount", 0)
    _set_if_field(new_si, "change_amount", 0)
    _set_if_field(new_si, "base_change_amount", 0)
    _set_if_field(new_si, "write_off_amount", 0)
    _set_if_field(new_si, "base_write_off_amount", 0)
    _set_if_field(new_si, "write_off_account", None)
    _set_if_field(new_si, "account_for_change_amount", None)
    _set_if_field(new_si, "loyalty_redemption_account", None)
    _set_if_field(new_si, "loyalty_redemption_cost_center", None)

    for item in new_si.items:
        item.cost_center = target.cost_center
        _set_if_field(item, "pos_invoice", None)
        _set_if_field(item, "pos_invoice_item", None)

        if item.income_account:
            item.income_account = _map_account(item.income_account, source_abbr)
        elif target.default_income_account:
            item.income_account = target.default_income_account
        else:
            raise LiteOpsDuplicationError(f"No income account for item {item.item_code}.")

        for fieldname in ("expense_account", "deferred_revenue_account", "discount_account"):
            if item.meta.has_field(fieldname) and item.get(fieldname):
                item.set(fieldname, _map_account(item.get(fieldname), source_abbr))

        if item.warehouse:
            item.warehouse = _map_warehouse(item.warehouse, source_abbr)

    for tax in new_si.taxes:
        if tax.account_head:
            tax.account_head = _map_account(tax.account_head, source_abbr)
        tax.cost_center = target.cost_center


def _create_payment_entries(new_si, payment_allocations: list[tuple[str, float, str]], source) -> None:
    for mode_of_payment, amount, paid_to_account in payment_allocations:
        pe = frappe.get_doc(
            {
                "doctype": "Payment Entry",
                "payment_type": "Receive",
                "company": TARGET_COMPANY,
                "posting_date": source.posting_date,
                "set_posting_time": 1,
                "mode_of_payment": mode_of_payment,
                "party_type": "Customer",
                "party": new_si.customer,
                "paid_from": new_si.debit_to,
                "paid_to": paid_to_account,
                "paid_amount": amount,
                "received_amount": amount,
                "reference_no": source.name,
                "reference_date": source.posting_date,
                "remarks": f"[DUP-PE:{source.name}] Payment for {new_si.name}",
                "references": [
                    {
                        "reference_doctype": "Sales Invoice",
                        "reference_name": new_si.name,
                        "allocated_amount": amount,
                    }
                ],
            }
        )
        pe.insert(ignore_permissions=True)
        pe.submit()


def _get_payment_allocations(
    payment_totals: OrderedDict[str, float],
    invoice_total: float,
    target,
) -> list[tuple[str, float, str]]:
    allocations: list[tuple[str, float, str]] = []
    remaining = flt(invoice_total)

    for mode_of_payment, amount in payment_totals.items():
        if remaining <= ROUNDING_TOLERANCE:
            break

        amount = flt(amount)
        if amount <= 0:
            continue

        allocated = min(amount, remaining)
        paid_to_account = _get_paid_to_account(mode_of_payment, target)
        allocations.append((mode_of_payment, flt(allocated), paid_to_account))
        remaining = flt(remaining - allocated)

    if remaining > ROUNDING_TOLERANCE:
        raise LiteOpsDuplicationError(
            f"Payment allocations are short by {remaining} for target duplicate."
        )

    if remaining and allocations:
        mode_of_payment, amount, paid_to_account = allocations[-1]
        allocations[-1] = (mode_of_payment, flt(amount + remaining), paid_to_account)

    return allocations


def _payment_totals_for_retry(source) -> OrderedDict[str, float]:
    if cint(source.get("is_pos")) or _get_pos_invoice_names(source.name):
        return _payment_totals_from_pos_invoices(source.name)
    return _payment_totals_from_payment_entries(source.name)


def _payment_totals_from_pos_invoices(
    sales_invoice: str,
    merge_log=None,
    pos_invoice_names: list[str] | None = None,
) -> OrderedDict[str, float]:
    pos_invoice_names = pos_invoice_names or _get_pos_invoice_names(sales_invoice, merge_log=merge_log)
    if not pos_invoice_names:
        raise LiteOpsDuplicationError(
            f"No POS Invoices are linked to consolidated Sales Invoice {sales_invoice}."
        )

    totals: OrderedDict[str, float] = OrderedDict()
    usable_pos_invoices = []

    for pos_invoice_name in pos_invoice_names:
        pos_invoice = frappe.get_doc("POS Invoice", pos_invoice_name)
        if pos_invoice.get("company") and pos_invoice.company != SOURCE_COMPANY:
            continue
        if pos_invoice.docstatus != 1:
            raise LiteOpsDuplicationError(f"POS Invoice {pos_invoice.name} is not submitted.")
        if cint(pos_invoice.get("is_return")):
            continue

        linked_invoice = pos_invoice.get("consolidated_invoice")
        if linked_invoice and linked_invoice != sales_invoice:
            continue

        usable_pos_invoices.append(pos_invoice.name)
        for payment in pos_invoice.get("payments", []):
            mode = payment.mode_of_payment
            amount = flt(payment.amount)
            if not mode or amount <= 0:
                continue
            totals[mode] = flt(totals.get(mode, 0) + amount)

    if not usable_pos_invoices:
        raise LiteOpsDuplicationError(
            f"No sales POS Invoices are linked to consolidated Sales Invoice {sales_invoice}."
        )
    if not totals:
        raise LiteOpsDuplicationError(
            f"No payment rows were found on POS Invoices for Sales Invoice {sales_invoice}."
        )

    return totals


def _get_pos_invoice_names(sales_invoice: str, merge_log=None) -> list[str]:
    names: OrderedDict[str, None] = OrderedDict()

    if merge_log:
        for row in merge_log.get("pos_invoices", []):
            if row.get("pos_invoice"):
                names[row.pos_invoice] = None

    for row in frappe.get_all(
        "POS Invoice",
        filters={"consolidated_invoice": sales_invoice, "docstatus": 1},
        fields=["name"],
        limit_page_length=0,
    ):
        names[row.name] = None

    for row in frappe.get_all(
        "Sales Invoice Item",
        filters={"parent": sales_invoice, "parenttype": "Sales Invoice"},
        fields=["pos_invoice"],
        limit_page_length=0,
    ):
        if row.pos_invoice:
            names[row.pos_invoice] = None

    return list(names.keys())


def _payment_totals_from_payment_entries(sales_invoice: str) -> OrderedDict[str, float]:
    totals: OrderedDict[str, float] = OrderedDict()
    references = frappe.get_all(
        "Payment Entry Reference",
        filters={
            "reference_doctype": "Sales Invoice",
            "reference_name": sales_invoice,
            "parenttype": "Payment Entry",
        },
        fields=["parent", "allocated_amount"],
        limit_page_length=0,
    )

    for reference in references:
        payment_entry = frappe.db.get_value(
            "Payment Entry",
            reference.parent,
            ["company", "docstatus", "payment_type", "mode_of_payment"],
            as_dict=True,
        )
        if not payment_entry:
            continue
        if payment_entry.company != SOURCE_COMPANY:
            continue
        if cint(payment_entry.docstatus) != 1 or payment_entry.payment_type != "Receive":
            continue

        mode = payment_entry.mode_of_payment
        amount = flt(reference.allocated_amount)
        if not mode or amount <= 0:
            continue
        totals[mode] = flt(totals.get(mode, 0) + amount)

    if not totals:
        raise LiteOpsDuplicationError(f"No submitted Payment Entries found for {sales_invoice}.")

    return totals


def _is_supported_source_invoice(doc) -> bool:
    if doc.company != SOURCE_COMPANY or doc.docstatus != 1:
        return False
    if cint(doc.get("is_return")):
        return False
    return True


def _sales_invoice_is_fully_paid(doc) -> bool:
    payable_total = _invoice_payable_total(doc)
    paid = sum(flt(payment.amount) for payment in doc.get("payments", []))
    if paid > 0:
        return paid + ROUNDING_TOLERANCE >= payable_total

    outstanding = doc.get("outstanding_amount")
    return outstanding not in (None, "") and flt(outstanding) <= ROUNDING_TOLERANCE


def _invoice_payable_total(doc) -> float:
    rounded_total = flt(doc.get("rounded_total"))
    if rounded_total > 0:
        return rounded_total
    return flt(doc.get("grand_total"))


def _invoice_amount_to_pay(doc) -> float:
    outstanding = flt(doc.get("outstanding_amount"))
    if outstanding > ROUNDING_TOLERANCE:
        return outstanding
    return _invoice_payable_total(doc)


def _payment_total_amount(payment_totals: OrderedDict[str, float]) -> float:
    return flt(sum(flt(amount) for amount in payment_totals.values()))


def _already_duplicated(source_name: str) -> bool:
    return bool(
        frappe.db.exists(
            "Sales Invoice",
            {
                "company": TARGET_COMPANY,
                "remarks": ["like", f"%{DUP_MARKER.format(source_name)}%"],
            },
        )
    )


def _get_target_company():
    target = frappe.db.get_value(
        "Company",
        TARGET_COMPANY,
        [
            "abbr",
            "cost_center",
            "default_income_account",
            "default_receivable_account",
        ],
        as_dict=True,
    )
    if not target:
        raise LiteOpsDuplicationError(f"Target company {TARGET_COMPANY} does not exist.")
    if not target.cost_center:
        raise LiteOpsDuplicationError(f"{TARGET_COMPANY} has no default cost center.")
    if not target.default_receivable_account:
        raise LiteOpsDuplicationError(f"{TARGET_COMPANY} has no default receivable account.")
    if not target.default_income_account:
        raise LiteOpsDuplicationError(f"{TARGET_COMPANY} has no default income account.")
    return target


def _map_account(source_account: str, source_abbr: str) -> str:
    account_name = _strip_company_suffix(source_account, source_abbr)
    mapped = frappe.db.get_value(
        "Account",
        {"account_name": account_name, "company": TARGET_COMPANY},
        "name",
    )
    if not mapped:
        raise LiteOpsDuplicationError(
            f"No {TARGET_COMPANY} account matched source account {source_account}."
        )
    return mapped


def _map_warehouse(source_warehouse: str, source_abbr: str) -> str:
    warehouse_name = _strip_company_suffix(source_warehouse, source_abbr)
    mapped = frappe.db.get_value(
        "Warehouse",
        {"warehouse_name": warehouse_name, "company": TARGET_COMPANY},
        "name",
    )
    if not mapped:
        raise LiteOpsDuplicationError(
            f"No {TARGET_COMPANY} warehouse matched source warehouse {source_warehouse}."
        )
    return mapped


def _get_paid_to_account(mode_of_payment: str, target) -> str:
    paid_to_account = frappe.db.get_value(
        "Mode of Payment Account",
        {"parent": mode_of_payment, "company": TARGET_COMPANY},
        "default_account",
    )
    if not paid_to_account:
        raise LiteOpsDuplicationError(
            f"No {TARGET_COMPANY} payment account found for mode of payment {mode_of_payment}."
        )
    return paid_to_account


def _is_cash_mode(mode_of_payment: str) -> bool:
    return CASH_MODE_KEYWORD in (mode_of_payment or "").lower()


def _strip_company_suffix(value: str, source_abbr: str) -> str:
    if not source_abbr:
        return value
    return value.replace(f" - {source_abbr}", "")


def _set_if_field(doc, fieldname: str, value) -> None:
    if doc.meta.has_field(fieldname):
        doc.set(fieldname, value)
