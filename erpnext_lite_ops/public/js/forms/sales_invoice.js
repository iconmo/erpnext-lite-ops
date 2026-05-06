frappe.ui.form.on("Sales Invoice", {
  refresh(frm) {
    if (!window.erpnext_lite_ops) return;

    if (
      frm.doc.docstatus === 1 &&
      frm.doc.company === "BazarT" &&
      flt(frm.doc.outstanding_amount) <= 0
    ) {
      frm.add_custom_button(
        __("Retry Clean Corp Duplicate"),
        () => {
          frappe
            .call({
              method: "erpnext_lite_ops.pos_duplication.retry_sales_invoice",
              args: {
                source_name: frm.doc.name,
              },
              freeze: true,
              freeze_message: __("Creating Clean Corp duplicate..."),
            })
            .then((response) => {
              const result = response.message || {};
              frappe.show_alert({
                message: result.created
                  ? __("Clean Corp duplicate {0} created.", [result.name])
                  : __(result.message || "Duplicate already exists."),
                indicator: result.created ? "green" : "orange",
              });
            });
        },
        __("Lite")
      );
    }

    erpnext_lite_ops.applyFormLiteMode(frm, {
      advanced_fields: [
        "update_stock",
        "set_warehouse",
        "selling_price_list",
        "price_list_currency",
        "plc_conversion_rate",
        "ignore_pricing_rule",
        "scan_barcode",
        "write_off_amount",
        "is_return",
        "return_against",
        "tc_name",
        "terms",
        "more_info",
      ],
    });
  },
});
