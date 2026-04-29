frappe.ui.form.on("Sales Taxes and Charges Template", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm);
  },
});
