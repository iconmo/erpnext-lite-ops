frappe.ui.form.on("Delivery Note", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "set_warehouse",
        "scan_barcode",
        "is_return",
        "return_against",
        "transporter",
        "driver",
        "lr_no",
        "vehicle_no",
        "incoterm",
        "named_place",
        "instructions",
        "tc_name",
        "terms",
        "more_info",
      ],
    });
  },
});
