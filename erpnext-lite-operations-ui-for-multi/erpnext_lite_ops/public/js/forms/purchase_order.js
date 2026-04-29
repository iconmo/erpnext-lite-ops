frappe.ui.form.on("Purchase Order", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "schedule_date",
        "set_warehouse",
        "buying_price_list",
        "price_list_currency",
        "plc_conversion_rate",
        "incoterm",
        "named_place",
        "tc_name",
        "terms",
        "more_info",
      ],
      workflow_actions: [
        {
          label: "Crear factura de compra",
          show(currentFrm) {
            return !currentFrm.is_new() && currentFrm.doc.docstatus === 1;
          },
          handler(currentFrm) {
            erpnext_lite_ops.openMappedDoc(
              "erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice",
              currentFrm
            );
          },
        },
      ],
    });
  },
});
