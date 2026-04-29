frappe.ui.form.on("Quotation", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "quotation_to",
        "valid_till",
        "order_type",
        "selling_price_list",
        "price_list_currency",
        "plc_conversion_rate",
        "ignore_pricing_rule",
        "campaign",
        "source",
        "tc_name",
        "terms",
        "more_info",
      ],
    });
  },
});
