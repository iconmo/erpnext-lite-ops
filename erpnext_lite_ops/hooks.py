from .constants import APP_LABEL, APP_LOGO, APP_ROUTE, ROLE_NAME

app_name = "erpnext_lite_ops"
app_title = "ERPNext Lite Operations"
app_publisher = "OpenAI Codex"
app_description = "Simplified multi-company ERPNext operations UI."
app_email = "support@example.com"
app_license = "MIT"
required_apps = ["erpnext"]

app_include_js = ["/assets/erpnext_lite_ops/js/lite_ops_boot_v2.js"]
app_include_css = ["/assets/erpnext_lite_ops/css/lite_ops_v2.css"]

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
    "Delivery Note": "public/js/forms/delivery_note.js",
    "Sales Invoice": "public/js/forms/sales_invoice.js",
    "Purchase Order": "public/js/forms/purchase_order.js",
    "Purchase Receipt": "public/js/forms/purchase_receipt.js",
    "Purchase Invoice": "public/js/forms/purchase_invoice.js",
    "Sales Taxes and Charges Template": "public/js/forms/sales_taxes_and_charges_template.js",
    "Purchase Taxes and Charges Template": "public/js/forms/purchase_taxes_and_charges_template.js",
}

doctype_list_js = {
    "Quotation": "public/js/lists/quotation_list.js",
    "Sales Order": "public/js/lists/sales_order_list.js",
    "Delivery Note": "public/js/lists/delivery_note_list.js",
    "Sales Invoice": "public/js/lists/sales_invoice_list.js",
    "Purchase Order": "public/js/lists/purchase_order_list.js",
    "Purchase Receipt": "public/js/lists/purchase_receipt_list.js",
    "Purchase Invoice": "public/js/lists/purchase_invoice_list.js",
    "Sales Taxes and Charges Template": "public/js/lists/sales_taxes_and_charges_template_list.js",
    "Purchase Taxes and Charges Template": "public/js/lists/purchase_taxes_and_charges_template_list.js",
}

permission_query_conditions = {
    "Quotation": "erpnext_lite_ops.permissions.quotation_query",
    "Sales Order": "erpnext_lite_ops.permissions.sales_order_query",
    "Delivery Note": "erpnext_lite_ops.permissions.delivery_note_query",
    "Sales Invoice": "erpnext_lite_ops.permissions.sales_invoice_query",
    "Purchase Order": "erpnext_lite_ops.permissions.purchase_order_query",
    "Purchase Receipt": "erpnext_lite_ops.permissions.purchase_receipt_query",
    "Purchase Invoice": "erpnext_lite_ops.permissions.purchase_invoice_query",
    "Sales Taxes and Charges Template": "erpnext_lite_ops.permissions.sales_taxes_template_query",
    "Purchase Taxes and Charges Template": "erpnext_lite_ops.permissions.purchase_taxes_template_query",
}

has_permission = {
    "Quotation": "erpnext_lite_ops.permissions.quotation_has_permission",
    "Sales Order": "erpnext_lite_ops.permissions.sales_order_has_permission",
    "Delivery Note": "erpnext_lite_ops.permissions.delivery_note_has_permission",
    "Sales Invoice": "erpnext_lite_ops.permissions.sales_invoice_has_permission",
    "Purchase Order": "erpnext_lite_ops.permissions.purchase_order_has_permission",
    "Purchase Receipt": "erpnext_lite_ops.permissions.purchase_receipt_has_permission",
    "Purchase Invoice": "erpnext_lite_ops.permissions.purchase_invoice_has_permission",
    "Sales Taxes and Charges Template": "erpnext_lite_ops.permissions.sales_taxes_template_has_permission",
    "Purchase Taxes and Charges Template": "erpnext_lite_ops.permissions.purchase_taxes_template_has_permission",
}

lite_ops_role = ROLE_NAME
