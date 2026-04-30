frappe.ui.form.on("Purchase Receipt", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "set_warehouse",
        "supplier_warehouse",
        "rejected_warehouse",
        "is_return",
        "return_against",
        "transporter",
        "driver",
        "lr_no",
        "vehicle_no",
        "bill_no",
        "bill_date",
        "tc_name",
        "terms",
        "more_info",
      ],
    });
  },
});
