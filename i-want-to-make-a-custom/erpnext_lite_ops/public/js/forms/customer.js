frappe.ui.form.on("Customer", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "default_currency",
        "tax_id",
        "tax_category",
        "territory",
        "customer_group",
        "language",
        "default_price_list",
        "default_bank_account",
        "payment_terms",
        "loyalty_program",
        "website",
      ],
      quick_actions: [
        {
          label: "New Contact",
          requires_saved: true,
          handler(currentFrm) {
            erpnext_lite_ops.createContextDoc("Contact", "Customer", currentFrm.doc.name);
          },
        },
        {
          label: "New Address",
          requires_saved: true,
          handler(currentFrm) {
            erpnext_lite_ops.createContextDoc("Address", "Customer", currentFrm.doc.name);
          },
        },
      ],
    });
  },
});
