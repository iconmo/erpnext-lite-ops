frappe.ui.form.on("Sales Order", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "set_warehouse",
        "reserve_stock",
        "selling_price_list",
        "price_list_currency",
        "plc_conversion_rate",
        "ignore_pricing_rule",
        "scan_barcode",
        "incoterm",
        "named_place",
        "tc_name",
        "terms",
        "more_info",
      ],
      workflow_actions: [
        {
          label: "Crear factura de venta",
          show(currentFrm) {
            return !currentFrm.is_new() && currentFrm.doc.docstatus === 1;
          },
          handler(currentFrm) {
            erpnext_lite_ops.openMappedDoc(
              "erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice",
              currentFrm
            );
          },
        },
      ],
    });
  },
});
