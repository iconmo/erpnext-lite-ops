from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, nowdate, nowtime

from .api import _user_has_lite_role
from .constants import SOURCE_COMPANY

GENERIC_CUSTOMERS = {"guest", "walk-in customer", "cash customer"}

HEADER_FIELDS = [
    "company",
    "customer",
    "customer_name",
    "posting_date",
    "posting_time",
    "due_date",
    "currency",
    "selling_price_list",
    "price_list_currency",
    "plc_conversion_rate",
    "conversion_rate",
    "set_warehouse",
    "tax_category",
    "campaign",
    "source",
    "cost_center",
    "project",
    "apply_discount_on",
    "additional_discount_percentage",
    "discount_amount",
    "ignore_pricing_rule",
]

ITEM_FIELDS = [
    "item_code",
    "item_name",
    "description",
    "qty",
    "uom",
    "stock_uom",
    "conversion_factor",
    "warehouse",
    "rate",
    "price_list_rate",
    "base_rate",
    "amount",
    "base_amount",
    "discount_percentage",
    "discount_amount",
    "income_account",
    "expense_account",
    "cost_center",
    "batch_no",
    "serial_no",
    "use_serial_batch_fields",
]

TAX_FIELDS = [
    "charge_type",
    "account_head",
    "description",
    "rate",
    "tax_amount",
    "base_tax_amount",
    "tax_amount_after_discount_amount",
    "base_tax_amount_after_discount_amount",
    "included_in_print_rate",
    "cost_center",
    "total",
    "base_total",
    "item_wise_tax_detail",
    "dont_recompute_tax",
]


@frappe.whitelist()
def create_unpaid_sales_invoice(source_doc) -> dict:
    if not _user_has_lite_role():
        frappe.throw(_("You do not have access to Lite Operations."))

    source = frappe._dict(frappe.parse_json(source_doc) or {})
    if source.get("company") != SOURCE_COMPANY:
        frappe.throw(_("Unpaid POS invoices can only be created for {0}.").format(SOURCE_COMPANY))

    if _has_payment_amount(source):
        frappe.throw(_("This cart already has a payment. Use normal POS checkout for paid sales."))

    _validate_customer(source)

    sales_invoice = frappe.new_doc("Sales Invoice")
    _copy_fields(source, sales_invoice, HEADER_FIELDS)

    sales_invoice.company = SOURCE_COMPANY
    sales_invoice.posting_date = sales_invoice.posting_date or nowdate()
    sales_invoice.posting_time = sales_invoice.posting_time or nowtime()
    sales_invoice.due_date = sales_invoice.due_date or sales_invoice.posting_date
    sales_invoice.set_posting_time = 1
    sales_invoice.is_pos = 0
    sales_invoice.update_stock = _get_update_stock(source)
    sales_invoice.remarks = _("Created from unpaid POS cart.")
    sales_invoice.set("payments", [])

    _copy_items(source, sales_invoice)
    _copy_taxes(source, sales_invoice)

    sales_invoice.insert(ignore_permissions=True)
    sales_invoice.submit()

    return {
        "doctype": sales_invoice.doctype,
        "name": sales_invoice.name,
    }


def _copy_fields(source, target, fields: list[str]) -> None:
    for fieldname in fields:
        value = source.get(fieldname)
        if value in (None, ""):
            continue
        if target.meta.has_field(fieldname):
            target.set(fieldname, value)


def _copy_items(source, sales_invoice) -> None:
    items = [frappe._dict(item) for item in (source.get("items") or [])]
    valid_items = [item for item in items if item.get("item_code") and flt(item.get("qty")) > 0]
    if not valid_items:
        frappe.throw(_("Add at least one item before creating an unpaid invoice."))

    for source_item in valid_items:
        target_item = {}
        for fieldname in ITEM_FIELDS:
            value = source_item.get(fieldname)
            if value in (None, ""):
                continue
            target_item[fieldname] = value
        sales_invoice.append("items", target_item)


def _copy_taxes(source, sales_invoice) -> None:
    for source_tax in source.get("taxes") or []:
        source_tax = frappe._dict(source_tax)
        target_tax = {}
        for fieldname in TAX_FIELDS:
            value = source_tax.get(fieldname)
            if value in (None, ""):
                continue
            target_tax[fieldname] = value
        if target_tax:
            sales_invoice.append("taxes", target_tax)


def _has_payment_amount(source) -> bool:
    for payment in source.get("payments") or []:
        amount = flt(frappe._dict(payment).get("amount"))
        if amount > 0:
            return True
    return False


def _validate_customer(source) -> None:
    customer = source.get("customer")
    if not customer:
        frappe.throw(_("Choose a real customer before creating an unpaid invoice."))

    if customer.strip().lower() in GENERIC_CUSTOMERS:
        frappe.throw(_("Choose a real customer before creating an unpaid invoice."))

    default_customer = _get_pos_profile_default_customer(source.get("pos_profile"))
    if default_customer and customer == default_customer:
        frappe.throw(_("Choose a real customer before creating an unpaid invoice."))


def _get_pos_profile_default_customer(pos_profile: str | None) -> str | None:
    if not pos_profile:
        return None
    try:
        return frappe.db.get_value("POS Profile", pos_profile, "customer")
    except Exception:
        return None


def _get_update_stock(source) -> int:
    if source.get("update_stock") is not None:
        return cint(source.get("update_stock"))

    pos_profile = source.get("pos_profile")
    if pos_profile:
        try:
            return cint(frappe.db.get_value("POS Profile", pos_profile, "update_stock"))
        except Exception:
            return 0

    return 0
