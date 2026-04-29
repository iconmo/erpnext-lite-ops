from __future__ import annotations

from typing import Iterable

import frappe
from frappe import _

from .constants import (
    ALL_ALLOWED_DOCTYPES,
    APP_LABEL,
    APP_ROUTE,
    APP_TITLE,
    COMPANY_SCOPED_DOCTYPES,
    PAGE_SECTIONS,
    ROLE_NAME,
    SUPPORT_LINKS,
)


def _is_administrator(user: str | None = None) -> bool:
    return (user or frappe.session.user) == "Administrator"


def _user_has_lite_role(user: str | None = None) -> bool:
    user = user or frappe.session.user
    if _is_administrator(user):
        return True
    return ROLE_NAME in frappe.get_roles(user)


def has_app_permission(*args, **kwargs) -> bool:
    return _user_has_lite_role()


def _get_user_default_company(user: str | None = None) -> str | None:
    user = user or frappe.session.user

    try:
        current = frappe.defaults.get_user_default("Company", user)
    except TypeError:
        current = frappe.defaults.get_user_default("Company")

    if current:
        return current

    try:
        current = frappe.defaults.get_user_default("company", user)
    except TypeError:
        current = frappe.defaults.get_user_default("company")

    return current


def get_allowed_companies(user: str | None = None) -> list[str]:
    user = user or frappe.session.user
    if _is_administrator(user):
        return [d.name for d in frappe.get_all("Company", fields=["name"], order_by="name asc")]

    permissions = frappe.get_all(
        "User Permission",
        filters={"user": user, "allow": "Company"},
        fields=["for_value", "is_default"],
        order_by="is_default desc, creation asc",
    )

    if permissions:
        seen = set()
        companies = []
        for row in permissions:
            if row.for_value and row.for_value not in seen and frappe.db.exists("Company", row.for_value):
                seen.add(row.for_value)
                companies.append(row.for_value)
        return companies

    return []


def get_active_company(user: str | None = None, allowed_companies: Iterable[str] | None = None) -> str | None:
    user = user or frappe.session.user
    allowed_companies = list(allowed_companies or get_allowed_companies(user))

    current = _get_user_default_company(user)
    if current in allowed_companies:
        return current

    global_default = frappe.defaults.get_global_default("company") or frappe.defaults.get_global_default("Company")
    if global_default in allowed_companies:
        return global_default

    return allowed_companies[0] if allowed_companies else None


def _ensure_company_allowed(company: str, user: str | None = None) -> str:
    user = user or frappe.session.user
    allowed_companies = get_allowed_companies(user)

    if not company:
        frappe.throw(_("Company is required."))

    if not allowed_companies:
        frappe.throw(_("No allowed companies are configured for this user."))

    if company not in allowed_companies:
        frappe.throw(_("You are not allowed to work in company {0}.").format(frappe.bold(company)))

    if not frappe.db.exists("Company", company):
        frappe.throw(_("Company {0} does not exist.").format(frappe.bold(company)))

    return company


def _count_for_doctype(doctype: str, active_company: str | None) -> int:
    filters = {}
    if doctype in COMPANY_SCOPED_DOCTYPES:
        if not active_company:
            return 0
        filters["company"] = active_company
    return frappe.db.count(doctype, filters=filters)


def _build_sections(active_company: str | None) -> list[dict]:
    sections = []
    for section in PAGE_SECTIONS:
        items = []
        for item in section["items"]:
            items.append(
                {
                    "doctype": item["doctype"],
                    "label": item["label"],
                    "company_scoped": item["company_scoped"],
                    "count": _count_for_doctype(item["doctype"], active_company),
                }
            )

        sections.append(
            {
                "id": section["id"],
                "label": section["label"],
                "description": section["description"],
                "items": items,
            }
        )
    return sections


@frappe.whitelist()
def get_context_payload() -> dict:
    if not _user_has_lite_role():
        frappe.throw(_("You do not have access to Lite Operations."))

    companies = get_allowed_companies()
    active_company = get_active_company(allowed_companies=companies)

    return {
        "app_label": APP_LABEL,
        "app_route": APP_ROUTE,
        "app_title": APP_TITLE,
        "role": ROLE_NAME,
        "companies": [{"name": company, "label": company} for company in companies],
        "active_company": active_company,
        "has_company_access": bool(companies),
        "company_setup_required": not bool(companies),
        "sections": _build_sections(active_company),
        "support_links": SUPPORT_LINKS,
        "allowed_doctypes": ALL_ALLOWED_DOCTYPES,
        "company_scoped_doctypes": COMPANY_SCOPED_DOCTYPES,
    }


@frappe.whitelist()
def set_active_company(company: str) -> dict:
    if not _user_has_lite_role():
        frappe.throw(_("You do not have access to Lite Operations."))

    company = _ensure_company_allowed(company)

    frappe.defaults.set_user_default("Company", company, frappe.session.user)
    frappe.defaults.set_user_default("company", company, frappe.session.user)

    return {"company": company}


def _guess_context_label(link_doctype: str | None, link_name: str | None) -> str:
    if not link_doctype or not link_name:
        return ""

    title_candidates = {
        "Customer": "customer_name",
        "Supplier": "supplier_name",
        "Item": "item_name",
    }

    fieldname = title_candidates.get(link_doctype)
    if fieldname:
        return frappe.db.get_value(link_doctype, link_name, fieldname) or link_name
    return link_name


@frappe.whitelist()
def create_context_doc(target_doctype: str, link_doctype: str | None = None, link_name: str | None = None) -> dict:
    if not _user_has_lite_role():
        frappe.throw(_("You do not have access to Lite Operations."))

    if target_doctype not in {"Contact", "Address", "Item Price"}:
        frappe.throw(_("Unsupported quick-create target: {0}").format(target_doctype))

    label = _guess_context_label(link_doctype, link_name)
    doc = frappe.new_doc(target_doctype)

    if target_doctype == "Contact":
        doc.first_name = label or _("New Contact")
        if link_doctype and link_name:
            doc.append("links", {"link_doctype": link_doctype, "link_name": link_name, "link_title": label or link_name})

    elif target_doctype == "Address":
        doc.address_title = label or link_name or _("New Address")
        doc.address_type = "Billing"
        if link_doctype and link_name:
            doc.append("links", {"link_doctype": link_doctype, "link_name": link_name, "link_title": label or link_name})

    elif target_doctype == "Item Price":
        doc.item_code = link_name
        doc.selling = 1

    return doc.as_dict()
