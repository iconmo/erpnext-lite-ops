frappe.listview_settings["Purchase Invoice"] = {
  onload(listview) {
    if (!window.erpnext_lite_ops) return;

    erpnext_lite_ops.applyListLiteMode(listview, {
      company_field: "company",
    });
  },
};
