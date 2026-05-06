(function () {
  const PAGE_NAME = "point-of-sale";
  const BUTTON_LABEL = __("Create Unpaid Invoice");
  const LEGACY_BUTTON_LABEL = __("Open Sales Invoice");
  const PATCH_FLAG = "__lite_ops_unpaid_invoice_patched__";
  const WAIT_MS = 250;
  const MAX_ATTEMPTS = 120;

  function hasPayment(sourceDoc) {
    return (sourceDoc.payments || []).some((payment) => flt(payment.amount) > 0);
  }

  function getCartItems(sourceDoc) {
    return (sourceDoc.items || []).filter((item) => item.item_code && flt(item.qty) > 0);
  }

  function removeLegacyButton(page) {
    if (!page || typeof page.remove_inner_button !== "function") {
      return;
    }

    page.remove_inner_button(LEGACY_BUTTON_LABEL);
    page.remove_inner_button("Open Sales Invoice");
  }

  function blockLegacyButton(page) {
    if (!page || page.__lite_ops_legacy_button_blocked || typeof page.add_inner_button !== "function") {
      return;
    }

    const originalAddInnerButton = page.add_inner_button;
    page.add_inner_button = function (label) {
      const normalized = String(label || "").trim().toLowerCase();
      if (normalized === "open sales invoice" || normalized === String(LEGACY_BUTTON_LABEL).trim().toLowerCase()) {
        removeLegacyButton(page);
        return null;
      }

      return originalAddInnerButton.apply(this, arguments);
    };
    page.__lite_ops_legacy_button_blocked = true;
  }

  async function clearPosCart(controller) {
    if (!controller || typeof controller.load_new_invoice_on_pos !== "function") {
      return;
    }

    await Promise.resolve(controller.load_new_invoice_on_pos());
  }

  function createUnpaidInvoice(controller) {
    const sourceDoc = controller && controller.frm && controller.frm.doc;
    if (!sourceDoc) {
      frappe.show_alert({
        message: __("The POS cart is not ready yet."),
        indicator: "orange",
      });
      return;
    }

    if (!getCartItems(sourceDoc).length) {
      frappe.show_alert({
        message: __("Add at least one item before creating an unpaid invoice."),
        indicator: "orange",
      });
      return;
    }

    if (hasPayment(sourceDoc)) {
      frappe.msgprint({
        title: __("Use POS Checkout"),
        indicator: "orange",
        message: __("This cart already has a payment. Use normal POS checkout for paid sales."),
      });
      return;
    }

    frappe.confirm(
      __("Create and submit an unpaid Sales Invoice for this POS cart?"),
      () => {
        frappe
          .call({
            method: "erpnext_lite_ops.pos_unpaid.create_unpaid_sales_invoice",
            args: {
              source_doc: sourceDoc,
            },
            freeze: true,
            freeze_message: __("Creating unpaid invoice..."),
          })
          .then(async (response) => {
            const invoice = response.message;
            if (!invoice || !invoice.name) {
              return;
            }

            await clearPosCart(controller);
            frappe.show_alert({
              message: __("Unpaid invoice {0} created.", [invoice.name]),
              indicator: "green",
            });
            frappe.set_route("Form", "Sales Invoice", invoice.name);
          });
      }
    );
  }

  function addButton(controller) {
    if (!controller || !controller.page || typeof controller.page.add_inner_button !== "function") {
      return;
    }

    const page = controller.page;
    blockLegacyButton(page);
    removeLegacyButton(page);

    if (typeof page.remove_inner_button === "function") {
      page.remove_inner_button(BUTTON_LABEL);
    }

    page.add_inner_button(BUTTON_LABEL, () => {
      createUnpaidInvoice(controller);
    });

    if (typeof page.change_inner_button_type === "function") {
      page.change_inner_button_type(BUTTON_LABEL, null, "secondary");
    }
  }

  function patchController() {
    if (
      !window.erpnext ||
      !erpnext.PointOfSale ||
      !erpnext.PointOfSale.Controller ||
      !erpnext.PointOfSale.Controller.prototype
    ) {
      return false;
    }

    const controllerPrototype = erpnext.PointOfSale.Controller.prototype;
    if (controllerPrototype[PATCH_FLAG]) {
      if (window.cur_pos) {
        addButton(window.cur_pos);
      }
      return true;
    }

    const originalPrepareBtns = controllerPrototype.prepare_btns;
    controllerPrototype.prepare_btns = function () {
      const result = originalPrepareBtns.apply(this, arguments);
      addButton(this);
      return result;
    };

    controllerPrototype[PATCH_FLAG] = true;

    if (window.cur_pos) {
      addButton(window.cur_pos);
    }

    return true;
  }

  function waitForController(attempt) {
    if (patchController()) {
      return;
    }

    if (attempt >= MAX_ATTEMPTS) {
      return;
    }

    window.setTimeout(() => waitForController(attempt + 1), WAIT_MS);
  }

  const pageConfig = frappe.pages[PAGE_NAME] || {};
  const originalRefresh = pageConfig.refresh;

  frappe.pages[PAGE_NAME] = pageConfig;
  frappe.pages[PAGE_NAME].refresh = function (wrapper) {
    if (typeof originalRefresh === "function") {
      originalRefresh(wrapper);
    }

    waitForController(0);

    if (wrapper && wrapper.pos) {
      addButton(wrapper.pos);
    } else if (window.cur_pos) {
      addButton(window.cur_pos);
    }
  };

  waitForController(0);
})();
