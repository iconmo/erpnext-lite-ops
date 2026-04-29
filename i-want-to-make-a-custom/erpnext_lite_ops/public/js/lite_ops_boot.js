frappe.provide("erpnext_lite_ops");

(function () {
  const lite = erpnext_lite_ops;

  lite.role = "Lite Operations User";
  lite.route = "lite-operations";
  lite.allowedDoctypes = [
    "Company",
    "Item",
    "Customer",
    "Supplier",
    "Quotation",
    "Sales Order",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Invoice",
    "Contact",
    "Address",
    "Item Price",
    "Price List",
    "Sales Taxes and Charges Template",
    "Purchase Taxes and Charges Template",
    "Payment Terms Template",
  ];
  lite.companyScopedDoctypes = [
    "Quotation",
    "Sales Order",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Invoice",
  ];
  lite.state = {
    context: null,
    switcherReady: false,
    guardReady: false,
    lastRedirectKey: null,
  };

  lite.isLiteUser = function () {
    if (frappe.session?.user === "Administrator") {
      return true;
    }
    if (frappe.user?.has_role) {
      return frappe.user.has_role(lite.role);
    }
    return (frappe.user_roles || []).includes(lite.role);
  };

  lite.fetchContext = function (force = false) {
    if (!lite.isLiteUser()) {
      return Promise.resolve(null);
    }

    if (!force && lite.state.context) {
      return Promise.resolve(lite.state.context);
    }

    return frappe.call({
      method: "erpnext_lite_ops.api.get_context_payload",
    }).then((response) => {
      lite.state.context = response.message;
      return lite.state.context;
    });
  };

  lite.getActiveCompany = function () {
    return (
      lite.state.context?.active_company ||
      frappe.defaults.get_user_default("Company") ||
      null
    );
  };

  lite.allowRoute = function (route) {
    if (!route || !route.length) {
      return true;
    }

    const [view, doctype] = route;

    if (view === lite.route) {
      return true;
    }

    if (view === "List" || view === "Form") {
      return lite.allowedDoctypes.includes(doctype);
    }

    return false;
  };

  lite.guardRoute = function () {
    if (!lite.isLiteUser()) {
      return;
    }

    const route = frappe.get_route ? frappe.get_route() : [];
    const routeKey = route.join("/");

    if (lite.allowRoute(route)) {
      lite.state.lastRedirectKey = null;
      return;
    }

    if (lite.state.lastRedirectKey === routeKey) {
      return;
    }

    lite.state.lastRedirectKey = routeKey;
    frappe.show_alert({
      message: __("Lite Operations keeps this user focused on the simplified workspace."),
      indicator: "orange",
    });
    frappe.set_route(lite.route);
  };

  lite.openList = function (doctype) {
    const filters = {};
    if (lite.companyScopedDoctypes.includes(doctype) && lite.getActiveCompany()) {
      filters.company = lite.getActiveCompany();
    }
    frappe.route_options = filters;
    frappe.set_route("List", doctype, "List");
  };

  lite.openNew = function (doctype, defaults = {}) {
    const routeDefaults = Object.assign({}, defaults);
    if (lite.companyScopedDoctypes.includes(doctype) && lite.getActiveCompany()) {
      routeDefaults.company = routeDefaults.company || lite.getActiveCompany();
    }

    if (frappe.new_doc) {
      frappe.new_doc(doctype, routeDefaults);
      return;
    }

    frappe.route_options = routeDefaults;
    frappe.set_route("Form", doctype, "new");
  };

  lite.createContextDoc = function (targetDoctype, linkDoctype, linkName) {
    return frappe.call({
      method: "erpnext_lite_ops.api.create_context_doc",
      args: {
        target_doctype: targetDoctype,
        link_doctype: linkDoctype,
        link_name: linkName,
      },
    }).then((response) => {
      frappe.model.sync(response.message);
      frappe.set_route("Form", response.message.doctype, response.message.name);
    });
  };

  lite.ensureCompanyDefault = function (frm) {
    if (!lite.isLiteUser()) {
      return;
    }
    if (!frm.get_field || !frm.get_field("company")) {
      return;
    }

    const company = lite.getActiveCompany();
    if (!company) {
      return;
    }

    if (frm.is_new() && !frm.doc.company) {
      frm.set_value("company", company);
    }
  };

  lite.applyAdvancedFieldVisibility = function (frm, config = {}) {
    const advancedFields = config.advanced_fields || [];

    advancedFields.forEach((fieldname) => {
      if (frm.get_field(fieldname)) {
        frm.toggle_display(fieldname, !!frm.__lite_ops_show_advanced);
      }
    });

    if (frm.remove_custom_button) {
      frm.remove_custom_button(__("More details"), __("Lite"));
      frm.remove_custom_button(__("Hide details"), __("Lite"));
    }

    if (advancedFields.length) {
      frm.add_custom_button(
        __(frm.__lite_ops_show_advanced ? "Hide details" : "More details"),
        () => {
          frm.__lite_ops_show_advanced = !frm.__lite_ops_show_advanced;
          lite.applyAdvancedFieldVisibility(frm, config);
        },
        __("Lite")
      );
    }
  };

  lite.applyQuickActions = function (frm, config = {}) {
    (config.quick_actions || []).forEach((action) => {
      if (frm.remove_custom_button) {
        frm.remove_custom_button(__(action.label), __("Quick actions"));
      }

      const canRun = action.requires_saved ? !frm.is_new() : true;
      if (!canRun) {
        return;
      }

      frm.add_custom_button(
        __(action.label),
        () => action.handler(frm),
        __("Quick actions")
      );
    });
  };

  lite.applyFormLiteMode = function (frm, config = {}) {
    if (!lite.isLiteUser()) {
      return;
    }

    if (typeof frm.__lite_ops_show_advanced === "undefined") {
      frm.__lite_ops_show_advanced = false;
    }

    lite.ensureCompanyDefault(frm);
    lite.applyAdvancedFieldVisibility(frm, config);
    lite.applyQuickActions(frm, config);
  };

  lite.renderCompanySwitcher = function () {
    if (!lite.isLiteUser()) {
      return;
    }

    if (lite.state.switcherReady && document.querySelector(".lite-ops-company-switcher")) {
      return;
    }

    lite.fetchContext().then((context) => {
      if (!context) {
        return;
      }

      const existing = document.querySelector(".lite-ops-company-switcher");
      if (existing) {
        existing.remove();
      }

      const wrap = document.createElement("div");
      wrap.className = "lite-ops-company-switcher";
      wrap.innerHTML = `
        <label for="lite-ops-company-select">${__("Company")}</label>
        <select id="lite-ops-company-select"></select>
      `;

      const select = wrap.querySelector("select");
      (context.companies || []).forEach((company) => {
        const option = document.createElement("option");
        option.value = company.name;
        option.textContent = company.label;
        option.selected = company.name === context.active_company;
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        frappe.call({
          method: "erpnext_lite_ops.api.set_active_company",
          args: { company: select.value },
        }).then((response) => {
          lite.state.context = Object.assign({}, lite.state.context || {}, {
            active_company: response.message.company,
          });

          frappe.show_alert({
            message: __("Company switched to {0}.", [response.message.company]),
            indicator: "green",
          });

          window.location.reload();
        });
      });

      document.body.appendChild(wrap);
      document.body.classList.add("lite-ops-user");
      lite.state.switcherReady = true;
    });
  };

  lite.initialize = function () {
    if (!lite.isLiteUser()) {
      return;
    }

    lite.renderCompanySwitcher();

    if (!lite.state.guardReady) {
      lite.state.guardReady = true;
      window.setInterval(lite.guardRoute, 1200);
    }
  };

  window.setTimeout(() => {
    lite.initialize();
  }, 250);

  frappe.after_ajax(() => {
    lite.initialize();
  });
})();
