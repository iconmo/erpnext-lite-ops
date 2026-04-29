from .constants import APP_LABEL, APP_LOGO, APP_ROUTE, ROLE_NAME

app_name = "erpnext_lite_ops"
app_title = "ERPNext Lite Operations"
app_publisher = "OpenAI Codex"
app_description = "Simplified multi-company ERPNext operations UI."
app_email = "support@example.com"
app_license = "MIT"
required_apps = ["erpnext"]

app_include_js = ["/assets/erpnext_lite_ops/js/lite_ops_boot.js"]
app_include_css = ["/assets/erpnext_lite_ops/css/lite_ops.css"]

after_install = "erpnext_lite_ops.install.after_install"
after_migrate = "erpnext_lite_ops.install.after_migrate"

add_to_apps_screen = [
    {
        "name": "erpnext-lite-ops",
        "logo": APP_LOGO,
        "title": APP_LABEL,
        "route": f"/app/{APP_ROUTE}",
        "has_permission": "erpnext_lite_ops.api.has_app_permission",
    }
]

doctype_js = {
    "Item": "public/js/forms/item.js",
    "Customer": "public/js/forms/customer.js",
    "Supplier": "public/js/forms/supplier.js",
    "Quotation": "public/js/forms/quotation.js",
    "Sales Order": "public/js/forms/sales_order.js",
    "Sales Invoice": "public/js/forms/sales_invoice.js",
    "Purchase Order": "public/js/forms/purchase_order.js",
    "Purchase Invoice": "public/js/forms/purchase_invoice.js",
}

permission_query_conditions = {
    "Quotation": "erpnext_lite_ops.permissions.quotation_query",
    "Sales Order": "erpnext_lite_ops.permissions.sales_order_query",
    "Sales Invoice": "erpnext_lite_ops.permissions.sales_invoice_query",
    "Purchase Order": "erpnext_lite_ops.permissions.purchase_order_query",
    "Purchase Invoice": "erpnext_lite_ops.permissions.purchase_invoice_query",
}

has_permission = {
    "Quotation": "erpnext_lite_ops.permissions.quotation_has_permission",
    "Sales Order": "erpnext_lite_ops.permissions.sales_order_has_permission",
    "Sales Invoice": "erpnext_lite_ops.permissions.sales_invoice_has_permission",
    "Purchase Order": "erpnext_lite_ops.permissions.purchase_order_has_permission",
    "Purchase Invoice": "erpnext_lite_ops.permissions.purchase_invoice_has_permission",
}

lite_ops_role = ROLE_NAME
