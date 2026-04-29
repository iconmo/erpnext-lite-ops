frappe.ui.form.on("Supplier", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "supplier_group",
        "supplier_type",
        "tax_id",
        "tax_category",
        "language",
        "default_currency",
        "default_bank_account",
        "payment_terms",
        "website",
      ],
      quick_actions: [
        {
          label: "Nuevo contacto",
          requires_saved: true,
          handler(currentFrm) {
            erpnext_lite_ops.createContextDoc("Contact", "Supplier", currentFrm.doc.name);
          },
        },
        {
          label: "Nueva direccion",
          requires_saved: true,
          handler(currentFrm) {
            erpnext_lite_ops.createContextDoc("Address", "Supplier", currentFrm.doc.name);
          },
        },
      ],
      workflow_actions: [
        {
          label: "Nuevo pedido de compra",
          show(currentFrm) {
            return !currentFrm.is_new();
          },
          handler(currentFrm) {
            erpnext_lite_ops.openNew("Purchase Order", {
              supplier: currentFrm.doc.name,
            });
          },
        },
      ],
    });
  },
});
