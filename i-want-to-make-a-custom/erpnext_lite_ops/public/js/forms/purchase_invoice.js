frappe.ui.form.on("Purchase Invoice", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "update_stock",
        "set_warehouse",
        "buying_price_list",
        "price_list_currency",
        "plc_conversion_rate",
        "is_return",
        "return_against",
        "bill_no",
        "bill_date",
        "tc_name",
        "terms",
        "more_info",
      ],
    });
  },
});
