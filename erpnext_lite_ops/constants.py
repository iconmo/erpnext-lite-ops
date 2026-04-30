ROLE_NAME = "Lite Operations User"
APP_ROUTE = "lite-operations"
APP_TITLE = "Lite Operations"
APP_LABEL = "Operaciones Lite"
APP_LOGO = "/assets/erpnext_lite_ops/lite_ops_logo.svg"
ALLOWED_ROUTES = ["point-of-sale"]

TOP_LEVEL_DOCTYPES = [
    "Item",
    "Customer",
    "Supplier",
    "Quotation",
    "Sales Order",
    "Delivery Note",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Receipt",
    "Purchase Invoice",
]

TRANSACTION_DOCTYPES = [
    "Quotation",
    "Sales Order",
    "Delivery Note",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Receipt",
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
            {
                "doctype": "Item",
                "label": "Articulos",
                "description": "Catalogo maestro para productos y servicios.",
                "company_scoped": False,
            },
            {
                "doctype": "Customer",
                "label": "Clientes",
                "description": "Base de clientes para presupuestos, pedidos y facturas.",
                "company_scoped": False,
            },
            {
                "doctype": "Supplier",
                "label": "Proveedores",
                "description": "Contactos de compra y abastecimiento operativo.",
                "company_scoped": False,
            },
        ],
    },
    {
        "id": "sales",
        "label": "Ventas",
        "description": "Flujo comercial desde presupuesto hasta factura.",
        "items": [
            {
                "doctype": "Quotation",
                "label": "Presupuestos",
                "description": "Ofertas y propuestas comerciales listas para convertir.",
                "company_scoped": True,
            },
            {
                "doctype": "Sales Order",
                "label": "Pedidos de venta",
                "description": "Pedidos confirmados para ejecucion y seguimiento.",
                "company_scoped": True,
            },
            {
                "doctype": "Delivery Note",
                "label": "Albaranes de entrega",
                "description": "Salidas y entregas de mercancia para clientes.",
                "company_scoped": True,
            },
            {
                "doctype": "Sales Invoice",
                "label": "Facturas de venta",
                "description": "Facturas finales y cobros del circuito comercial.",
                "company_scoped": True,
            },
        ],
    },
    {
        "id": "buying",
        "label": "Compras",
        "description": "Documentos de proveedores y compras operativas.",
        "items": [
            {
                "doctype": "Purchase Order",
                "label": "Pedidos de compra",
                "description": "Encargos a proveedor pendientes o en curso.",
                "company_scoped": True,
            },
            {
                "doctype": "Purchase Receipt",
                "label": "Recepciones de compra",
                "description": "Entradas y recepciones de mercancia desde proveedor.",
                "company_scoped": True,
            },
            {
                "doctype": "Purchase Invoice",
                "label": "Facturas de compra",
                "description": "Facturas recibidas para control y contabilizacion.",
                "company_scoped": True,
            },
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
