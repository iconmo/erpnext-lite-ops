from __future__ import annotations

import frappe

from .constants import ROLE_NAME

ROLE_PERMISSIONS = {
    "Company": {"read": 1, "report": 1},
    "Item": {"read": 1, "write": 1, "create": 1, "report": 1, "export": 1},
    "Customer": {"read": 1, "write": 1, "create": 1, "report": 1, "export": 1},
    "Supplier": {"read": 1, "write": 1, "create": 1, "report": 1, "export": 1},
    "Contact": {"read": 1, "write": 1, "create": 1},
    "Address": {"read": 1, "write": 1, "create": 1},
    "Item Price": {"read": 1, "write": 1, "create": 1},
    "Price List": {"read": 1, "report": 1},
    "Payment Terms Template": {"read": 1, "report": 1},
    "Sales Taxes and Charges Template": {"read": 1, "report": 1},
    "Purchase Taxes and Charges Template": {"read": 1, "report": 1},
    "Quotation": {"read": 1, "write": 1, "create": 1, "submit": 1, "cancel": 1, "print": 1, "email": 1, "report": 1, "export": 1, "apply_user_permissions": 1},
    "Sales Order": {"read": 1, "write": 1, "create": 1, "submit": 1, "cancel": 1, "print": 1, "email": 1, "report": 1, "export": 1, "apply_user_permissions": 1},
    "Sales Invoice": {"read": 1, "write": 1, "create": 1, "submit": 1, "cancel": 1, "print": 1, "email": 1, "report": 1, "export": 1, "apply_user_permissions": 1},
    "Purchase Order": {"read": 1, "write": 1, "create": 1, "submit": 1, "cancel": 1, "print": 1, "email": 1, "report": 1, "export": 1, "apply_user_permissions": 1},
    "Purchase Invoice": {"read": 1, "write": 1, "create": 1, "submit": 1, "cancel": 1, "print": 1, "email": 1, "report": 1, "export": 1, "apply_user_permissions": 1},
}


def after_install() -> None:
    ensure_role()
    sync_role_permissions()


def after_migrate() -> None:
    ensure_role()
    sync_role_permissions()


def ensure_role() -> None:
    if frappe.db.exists("Role", ROLE_NAME):
        return

    role = frappe.new_doc("Role")
    role.role_name = ROLE_NAME
    role.desk_access = 1
    role.insert(ignore_permissions=True)


def sync_role_permissions() -> None:
    try:
        from frappe.permissions import add_permission, update_permission_property
    except Exception:
        return

    for doctype, permissions in ROLE_PERMISSIONS.items():
        try:
            add_permission(doctype, ROLE_NAME, 0)
        except Exception:
            pass

        for perm_type, value in permissions.items():
            try:
                update_permission_property(doctype, ROLE_NAME, 0, perm_type, value)
            except Exception:
                frappe.log_error(
                    title="ERPNext Lite Ops permission sync failed",
                    message=f"Could not set {perm_type}={value} on {doctype} for role {ROLE_NAME}.",
                )
