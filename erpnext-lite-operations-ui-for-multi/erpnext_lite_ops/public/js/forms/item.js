frappe.ui.form.on("Item", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "brand",
        "stock_uom",
        "weight_uom",
        "weight_per_unit",
        "default_material_request_type",
        "country_of_origin",
        "barcodes",
        "customer_items",
        "supplier_items",
        "reorder_levels",
        "attributes",
      ],
      quick_actions: [
        {
          label: "Nueva tarifa",
          requires_saved: true,
          handler(currentFrm) {
            erpnext_lite_ops.createContextDoc("Item Price", "Item", currentFrm.doc.name);
          },
        },
      ],
    });
  },
});
