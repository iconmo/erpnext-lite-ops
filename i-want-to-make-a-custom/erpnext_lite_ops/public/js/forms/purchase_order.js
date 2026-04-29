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
    });
  },
});
