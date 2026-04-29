from __future__ import annotations

import frappe

from .api import get_active_company
from .constants import ROLE_NAME


def _has_lite_role(user: str | None = None) -> bool:
    user = user or frappe.session.user
    if user == "Administrator":
        return True
    return ROLE_NAME in frappe.get_roles(user)


def _company_query(doctype: str, user: str | None = None) -> str | None:
    user = user or frappe.session.user
    if not _has_lite_role(user):
        return None

    company = get_active_company(user=user)
    if not company:
        return "1 = 0"

    return f"`tab{doctype}`.`company` = {frappe.db.escape(company)}"


def _company_has_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool | None:
    user = user or frappe.session.user
    if not _has_lite_role(user):
        return None

    company = getattr(doc, "company", None)
    if not company:
        return None

    active_company = get_active_company(user=user)
    if not active_company:
        return False

    return company == active_company


def quotation_query(user: str | None = None) -> str | None:
    return _company_query("Quotation", user=user)


def sales_order_query(user: str | None = None) -> str | None:
    return _company_query("Sales Order", user=user)


def sales_invoice_query(user: str | None = None) -> str | None:
    return _company_query("Sales Invoice", user=user)


def purchase_order_query(user: str | None = None) -> str | None:
    return _company_query("Purchase Order", user=user)


def purchase_invoice_query(user: str | None = None) -> str | None:
    return _company_query("Purchase Invoice", user=user)


def quotation_has_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool | None:
    return _company_has_permission(doc, user=user, permission_type=permission_type)


def sales_order_has_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool | None:
    return _company_has_permission(doc, user=user, permission_type=permission_type)


def sales_invoice_has_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool | None:
    return _company_has_permission(doc, user=user, permission_type=permission_type)


def purchase_order_has_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool | None:
    return _company_has_permission(doc, user=user, permission_type=permission_type)


def purchase_invoice_has_permission(doc, user: str | None = None, permission_type: str | None = None) -> bool | None:
    return _company_has_permission(doc, user=user, permission_type=permission_type)
