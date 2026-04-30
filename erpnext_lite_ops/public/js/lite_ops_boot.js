frappe.provide("erpnext_lite_ops");

(function () {
  const lite = erpnext_lite_ops;

  lite.role = "Lite Operations User";
  lite.route = "lite-operations";
  lite.allowedDoctypes = [
    "Item",
    "Customer",
    "Supplier",
    "Quotation",
    "Sales Order",
    "Delivery Note",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Receipt",
    "Purchase Invoice",
    "Contact",
    "Address",
    "Item Price",
    "Price List",
    "Sales Taxes and Charges Template",
    "Purchase Taxes and Charges Template",
    "Payment Terms Template",
  ];
  lite.allowedRoutes = ["point-of-sale"];
  lite.companyScopedDoctypes = [
    "Quotation",
    "Sales Order",
    "Delivery Note",
    "Sales Invoice",
    "Purchase Order",
    "Purchase Receipt",
    "Purchase Invoice",
    "Sales Taxes and Charges Template",
    "Purchase Taxes and Charges Template",
  ];
  lite.state = {
    context: null,
    guardReady: false,
    lastRedirectKey: null,
    navigationObserver: null,
    navigationTimer: null,
    switcherObserver: null,
  };

  lite.slug = function (value) {
    if (frappe.router?.slug) {
      return frappe.router.slug(value);
    }

    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  lite.getAllowedRouteSegments = function () {
    if (!lite.state.allowedRouteSegments) {
      lite.state.allowedRouteSegments = new Set([lite.route]);
      lite.allowedDoctypes.forEach((doctype) => {
        lite.state.allowedRouteSegments.add(lite.slug(doctype));
      });
      lite.allowedRoutes.forEach((route) => {
        lite.state.allowedRouteSegments.add(String(route || "").toLowerCase());
      });
    }

    return lite.state.allowedRouteSegments;
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

    return frappe
      .call({
        method: "erpnext_lite_ops.api.get_context_payload",
      })
      .then((response) => {
        lite.state.context = response.message;
        return lite.state.context;
      })
      .catch(() => null);
  };

  lite.getActiveCompany = function () {
    return (
      lite.state.context?.active_company ||
      frappe.defaults.get_user_default("Company") ||
      frappe.defaults.get_user_default("company") ||
      null
    );
  };

  lite.allowRoute = function (route) {
    if (!route || !route.length) {
      return window.location.pathname.replace(/\/+$/, "") !== "/app";
    }

    const [view, doctype] = route;
    const normalizedView = String(view || "").toLowerCase();

    if (normalizedView === lite.route) {
      return true;
    }

    if (["list", "form", "print"].includes(normalizedView)) {
      return lite.allowedDoctypes.includes(doctype);
    }

    if (lite.getAllowedRouteSegments().has(normalizedView)) {
      return true;
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
      message: __("Operaciones Lite mantiene esta cuenta dentro del espacio simplificado."),
      indicator: "orange",
    });
    frappe.set_route(lite.route);
  };

  lite.isAllowedAppPath = function (pathname) {
    if (!pathname || !pathname.startsWith("/app")) {
      return true;
    }

    const parts = pathname
      .replace(/^\/app\/?/, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.toLowerCase());

    if (!parts.length) {
      return true;
    }

    const [first, second] = parts;
    const allowedSegments = lite.getAllowedRouteSegments();

    if (first === lite.route) {
      return true;
    }

    if (["list", "form", "print"].includes(first)) {
      return allowedSegments.has(second || "");
    }

    return allowedSegments.has(first);
  };

  lite.hideDisallowedLink = function (anchor) {
    if (!anchor || anchor.dataset.liteOpsChecked === "1") {
      return;
    }

    anchor.dataset.liteOpsChecked = "1";
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
      return;
    }

    let url;
    try {
      url = new URL(href, window.location.origin);
    } catch (error) {
      return;
    }

    if (url.origin !== window.location.origin || lite.isAllowedAppPath(url.pathname)) {
      return;
    }

    const target =
      anchor.closest(
        "li, .standard-sidebar-item, .dropdown-item, .search-result, .search-result-item, .module-item, .workspace-item, .shortcut-widget-box, .widget, .card"
      ) || anchor;

    target.setAttribute("data-lite-ops-hidden", "1");
  };

  lite.removeCompanySwitcher = function () {
    document.querySelectorAll(".lite-ops-company-switcher").forEach((node) => node.remove());
  };

  lite.observeCompanySwitcher = function () {
    if (lite.state.switcherObserver || !window.MutationObserver) {
      return;
    }

    lite.state.switcherObserver = new MutationObserver(() => {
      lite.removeCompanySwitcher();
    });

    lite.state.switcherObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  lite.pruneNavigation = function (root = document) {
    lite.removeCompanySwitcher();

    if (!lite.isLiteUser() || !root?.querySelectorAll) {
      return;
    }

    document.body.classList.add("lite-ops-user");
    root.querySelectorAll("a[href]").forEach((anchor) => lite.hideDisallowedLink(anchor));
  };

  lite.scheduleNavigationPrune = function () {
    lite.removeCompanySwitcher();

    if (!lite.isLiteUser()) {
      return;
    }

    if (lite.state.navigationTimer) {
      window.clearTimeout(lite.state.navigationTimer);
    }

    lite.state.navigationTimer = window.setTimeout(() => {
      lite.removeCompanySwitcher();
      lite.pruneNavigation(document);
    }, 120);
  };

  lite.observeNavigation = function () {
    if (!lite.isLiteUser() || lite.state.navigationObserver || !window.MutationObserver) {
      return;
    }

    lite.state.navigationObserver = new MutationObserver(() => {
      lite.scheduleNavigationPrune();
    });

    lite.state.navigationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
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

  lite.openPos = function () {
    if (frappe.set_route) {
      frappe.set_route("point-of-sale");
      return;
    }

    window.location.href = "/app/point-of-sale";
  };

  lite.openMappedDoc = function (method, frm) {
    if (!frm || frm.is_new()) {
      return;
    }

    if (frappe.model?.open_mapped_doc) {
      frappe.model.open_mapped_doc({ method, frm });
      return;
    }

    frappe.call({
      method,
      args: { source_name: frm.doc.name },
    });
  };

  lite.createContextDoc = function (targetDoctype, linkDoctype, linkName) {
    return frappe
      .call({
        method: "erpnext_lite_ops.api.create_context_doc",
        args: {
          target_doctype: targetDoctype,
          link_doctype: linkDoctype,
          link_name: linkName,
        },
      })
      .then((response) => {
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
      frm.remove_custom_button(__("Mas detalles"), __("Lite"));
      frm.remove_custom_button(__("Ocultar detalles"), __("Lite"));
    }

    if (advancedFields.length) {
      frm.add_custom_button(
        __(frm.__lite_ops_show_advanced ? "Ocultar detalles" : "Mas detalles"),
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
        frm.remove_custom_button(__(action.label), __("Acciones rapidas"));
      }

      const canRun = action.requires_saved ? !frm.is_new() : true;
      if (!canRun) {
        return;
      }

      frm.add_custom_button(__(action.label), () => action.handler(frm), __("Acciones rapidas"));
    });
  };

  lite.applyWorkflowActions = function (frm, config = {}) {
    (config.workflow_actions || []).forEach((action) => {
      if (frm.remove_custom_button) {
        frm.remove_custom_button(__(action.label), __("Siguientes pasos"));
      }

      const canRun = action.show ? action.show(frm) : !frm.is_new();
      if (!canRun) {
        return;
      }

      frm.add_custom_button(__(action.label), () => action.handler(frm), __("Siguientes pasos"));
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
    lite.applyWorkflowActions(frm, config);
  };

  lite.filterMatchesField = function (filter, fieldname) {
    if (Array.isArray(filter)) {
      return filter[1] === fieldname || filter[0] === fieldname;
    }

    return filter?.fieldname === fieldname;
  };

  lite.ensureListCompanyFilter = function (listview, companyField = "company") {
    const company = lite.getActiveCompany();
    if (!company || !listview?.filter_area?.add) {
      return;
    }

    const currentFilters = listview.filter_area.get ? listview.filter_area.get() : [];
    const hasCompanyFilter = (currentFilters || []).some((filter) =>
      lite.filterMatchesField(filter, companyField)
    );

    if (!hasCompanyFilter) {
      listview.filter_area.add([[listview.doctype, companyField, "=", company]]);
      if (listview.refresh) {
        listview.refresh();
      }
    }
  };

  lite.applyListLiteMode = function (listview, config = {}) {
    if (!lite.isLiteUser() || !listview) {
      return;
    }

    if (config.company_field) {
      lite.ensureListCompanyFilter(listview, config.company_field);
    }

    if (listview.page?.set_primary_action) {
      listview.page.set_primary_action(__("Nuevo"), () => lite.openNew(listview.doctype));
    }
  };

  lite.extendListViewSettings = function (doctype, config = {}) {
    const existing = frappe.listview_settings[doctype] || {};
    const previousOnload = existing.onload;

    frappe.listview_settings[doctype] = Object.assign({}, existing, {
      onload(listview) {
        if (typeof previousOnload === "function") {
          previousOnload.call(this, listview);
        }

        if (!window.erpnext_lite_ops) {
          return;
        }

        lite.applyListLiteMode(listview, config);
      },
    });
  };

  lite.initialize = function () {
    lite.removeCompanySwitcher();
    lite.observeCompanySwitcher();

    if (!lite.isLiteUser()) {
      return;
    }

    lite.scheduleNavigationPrune();
    lite.observeNavigation();

    if (!lite.state.guardReady) {
      lite.state.guardReady = true;
      lite.guardRoute();
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
