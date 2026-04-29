ROLE_NAME = "Lite Operations User"
APP_ROUTE = "lite-operations"
APP_TITLE = "Lite Operations"
APP_LABEL = "Operaciones Lite"
APP_LOGO = "/assets/erpnext_lite_ops/lite_ops_logo.svg"

TOP_LEVEL_DOCTYPES = [
    "Item",
    "Customer",
    "Supplier",
    "Quotation",
    "Sales Order",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Invoice",
]

TRANSACTION_DOCTYPES = [
    "Quotation",
    "Sales Order",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Invoice",
]

SUPPORT_DOCTYPES = [
    "Contact",
    "Address",
    "Item Price",
    "Price List",
    "Sales Taxes and Charges Template",
    "Purchase Taxes and Charges Template",
    "Payment Terms Template",
]

SUPPORT_COMPANY_SCOPED_DOCTYPES = [
    "Sales Taxes and Charges Template",
    "Purchase Taxes and Charges Template",
]

COMPANY_SCOPED_DOCTYPES = TRANSACTION_DOCTYPES + SUPPORT_COMPANY_SCOPED_DOCTYPES

ALL_ALLOWED_DOCTYPES = TOP_LEVEL_DOCTYPES + SUPPORT_DOCTYPES

PAGE_SECTIONS = [
    {
        "id": "masters",
        "label": "Datos base",
        "description": "Catalogos y terceros para trabajar a diario.",
        "items": [
            {"doctype": "Item", "label": "Articulos", "company_scoped": False},
            {"doctype": "Customer", "label": "Clientes", "company_scoped": False},
            {"doctype": "Supplier", "label": "Proveedores", "company_scoped": False},
        ],
    },
    {
        "id": "sales",
        "label": "Ventas",
        "description": "Flujo comercial desde presupuesto hasta factura.",
        "items": [
            {"doctype": "Quotation", "label": "Presupuestos", "company_scoped": True},
            {"doctype": "Sales Order", "label": "Pedidos de venta", "company_scoped": True},
            {"doctype": "Sales Invoice", "label": "Facturas de venta", "company_scoped": True},
        ],
    },
    {
        "id": "buying",
        "label": "Compras",
        "description": "Documentos de proveedores y compras operativas.",
        "items": [
            {"doctype": "Purchase Order", "label": "Pedidos de compra", "company_scoped": True},
            {"doctype": "Purchase Invoice", "label": "Facturas de compra", "company_scoped": True},
        ],
    },
]

SUPPORT_LINKS = [
    {"doctype": "Contact", "label": "Contactos"},
    {"doctype": "Address", "label": "Direcciones"},
    {"doctype": "Item Price", "label": "Tarifas"},
    {"doctype": "Price List", "label": "Listas de precios"},
    {"doctype": "Sales Taxes and Charges Template", "label": "Impuestos de venta"},
    {"doctype": "Purchase Taxes and Charges Template", "label": "Impuestos de compra"},
    {"doctype": "Payment Terms Template", "label": "Condiciones de pago"},
]
