frappe.ui.form.on("Payment Entry", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "naming_series",
        "book_advance_payments_in_separate_party_account",
        "apply_tax_withholding_amount",
        "tax_withholding_category",
        "base_paid_amount",
        "base_received_amount",
        "source_exchange_rate",
        "target_exchange_rate",
        "deductions_section",
        "write_off_amount",
      ],
    });
  },
});
