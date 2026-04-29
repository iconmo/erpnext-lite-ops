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
    });
  },
});
