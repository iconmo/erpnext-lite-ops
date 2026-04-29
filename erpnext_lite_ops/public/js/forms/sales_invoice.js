frappe.ui.form.on("Sales Invoice", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "update_stock",
        "set_warehouse",
        "selling_price_list",
        "price_list_currency",
        "plc_conversion_rate",
        "ignore_pricing_rule",
        "scan_barcode",
        "write_off_amount",
        "is_return",
        "return_against",
        "tc_name",
        "terms",
        "more_info",
      ],
    });
  },
});
