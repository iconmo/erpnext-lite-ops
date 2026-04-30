frappe.pages["lite-operations"] = frappe.pages["lite-operations"] || {};

const LITE_OPS_INLINE_STYLE_ID = "lite-ops-inline-page-styles";

frappe.pages["lite-operations"].on_page_load = function (wrapper) {
  const page = frappe.ui.make_app_page({
    parent: wrapper,
    title: __("Operaciones Lite"),
    single_column: true,
  });

  const pageState = frappe.pages["lite-operations"];
  pageState.page = page;
  pageState.wrapper = wrapper;

  ensure_lite_ops_inline_styles();
  observe_legacy_company_switcher(pageState);
  remove_legacy_company_switcher();
};

frappe.pages["lite-operations"].on_page_show = function (wrapper) {
  const pageState = frappe.pages["lite-operations"];
  const page = pageState.page;
  const $target = $(wrapper).find(".layout-main-section");

  ensure_lite_ops_inline_styles();
  remove_legacy_company_switcher();

  page.set_primary_action(__("Nuevo presupuesto"), () => {
    open_new_doc("Quotation");
  });

  page.set_secondary_action(__("Abrir Caja"), () => {
    open_pos_route();
  });

  $target.html(`<div class="text-muted">${__("Cargando espacio simplificado...")}</div>`);

  fetch_lite_context(true).then((context) => {
    if (!context) {
      $target.html(`<div class="text-danger">${__("No tienes acceso a este espacio.")}</div>`);
      return;
    }

    remove_legacy_company_switcher();
    $target.html(render_lite_operations(context));

    $target.find("[data-open-list]").on("click", function () {
      open_list_view($(this).data("open-list"));
    });

    $target.find("[data-open-new]").on("click", function () {
      open_new_doc($(this).data("open-new"));
    });

    $target.find("[data-open-pos]").on("click", function () {
      open_pos_route();
    });
  });
};

function ensure_lite_ops_inline_styles() {
  if (document.getElementById(LITE_OPS_INLINE_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = LITE_OPS_INLINE_STYLE_ID;
  style.textContent = `
    body .lite-ops-company-switcher {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    .layout-main-section .lite-ops-page {
      padding: 1.25rem !important;
      border-radius: 28px !important;
      background:
        radial-gradient(circle at top right, rgba(224, 193, 149, 0.2), transparent 32%),
        linear-gradient(180deg, #172127 0%, #1f2b32 100%) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
    }

    .layout-main-section .lite-ops-hero {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: end !important;
      justify-content: space-between !important;
      gap: 1rem !important;
      padding: 1.6rem !important;
      margin-bottom: 1.25rem !important;
      border: 1px solid rgba(240, 223, 192, 0.14) !important;
      border-radius: 24px !important;
      background: linear-gradient(145deg, #4b3a30 0%, #7b664c 100%) !important;
      color: #f3f8fb !important;
      box-shadow: 0 22px 44px rgba(20, 15, 12, 0.3) !important;
    }

    .layout-main-section .lite-ops-hero-copy {
      max-width: 760px !important;
    }

    .layout-main-section .lite-ops-kicker {
      display: inline-flex !important;
      align-items: center !important;
      padding: 0.45rem 0.7rem !important;
      border-radius: 999px !important;
      background: rgba(255, 255, 255, 0.12) !important;
      color: #f5fbff !important;
      font-size: 0.82rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.04em !important;
      text-transform: uppercase !important;
    }

    .layout-main-section .lite-ops-hero h1 {
      margin: 0.8rem 0 0.65rem !important;
      color: #ffffff !important;
      font-size: clamp(2.2rem, 4vw, 3.4rem) !important;
      line-height: 0.98 !important;
      opacity: 1 !important;
    }

    .layout-main-section .lite-ops-hero p {
      max-width: 58rem !important;
      margin: 0 !important;
      color: rgba(243, 248, 251, 0.92) !important;
      font-size: 1.08rem !important;
      line-height: 1.6 !important;
      opacity: 1 !important;
    }

    .layout-main-section .lite-ops-hero-actions {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.75rem !important;
    }

    .layout-main-section .lite-ops-page .btn {
      border-radius: 999px !important;
      font-weight: 700 !important;
    }

    .layout-main-section .lite-ops-hero .btn {
      min-height: 44px !important;
      padding-inline: 1.1rem !important;
    }

    .layout-main-section .lite-ops-hero .btn.btn-primary {
      border-color: #ffffff !important;
      background: #ffffff !important;
      color: #17313d !important;
    }

    .layout-main-section .lite-ops-hero .btn.btn-default {
      border-color: rgba(255, 255, 255, 0.16) !important;
      background: rgba(255, 255, 255, 0.12) !important;
      color: #ffffff !important;
    }

    .layout-main-section .lite-ops-sections {
      display: grid !important;
      gap: 1.25rem !important;
    }

    .layout-main-section .lite-ops-section {
      background: linear-gradient(180deg, #ffffff 0%, #f8fbfc 100%) !important;
      border: 1px solid #dce8ee !important;
      border-radius: 24px !important;
      padding: 1.35rem !important;
      box-shadow: 0 18px 36px rgba(8, 18, 24, 0.12) !important;
    }

    .layout-main-section .lite-ops-section-header {
      display: flex !important;
      align-items: end !important;
      justify-content: space-between !important;
      gap: 1rem !important;
      margin-bottom: 1rem !important;
    }

    .layout-main-section .lite-ops-section-header h2,
    .layout-main-section .lite-ops-card h3 {
      margin: 0 !important;
      color: #17313d !important;
      opacity: 1 !important;
      text-shadow: none !important;
      font-weight: 800 !important;
    }

    .layout-main-section .lite-ops-section-header h2 {
      font-size: clamp(1.85rem, 2vw, 2.5rem) !important;
      line-height: 1.05 !important;
    }

    .layout-main-section .lite-ops-section-header p,
    .layout-main-section .lite-ops-card p {
      color: #536977 !important;
      opacity: 1 !important;
      text-shadow: none !important;
    }

    .layout-main-section .lite-ops-section-header p {
      margin: 0.45rem 0 0 !important;
      font-size: 1.04rem !important;
    }

    .layout-main-section .lite-ops-card-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
      gap: 1rem !important;
    }

    .layout-main-section .lite-ops-card {
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      min-height: 250px !important;
      padding: 1.1rem !important;
      border: 1px solid #dce7ed !important;
      border-radius: 20px !important;
      background: linear-gradient(180deg, #ffffff 0%, #f5f9fb 100%) !important;
    }

    .layout-main-section .lite-ops-card-copy {
      display: grid !important;
      gap: 0.55rem !important;
    }

    .layout-main-section .lite-ops-card h3 {
      font-size: 1.75rem !important;
      line-height: 1.08 !important;
    }

    .layout-main-section .lite-ops-card p {
      margin: 0 !important;
      font-size: 1rem !important;
      line-height: 1.55 !important;
    }

    .layout-main-section .lite-ops-card-footer {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: end !important;
      justify-content: space-between !important;
      gap: 0.85rem !important;
      margin-top: 1.25rem !important;
    }

    .layout-main-section .lite-ops-count {
      color: #17313d !important;
      font-size: clamp(2.35rem, 4vw, 3.2rem) !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      opacity: 1 !important;
    }

    .layout-main-section .lite-ops-actions {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.6rem !important;
    }

    .layout-main-section .lite-ops-card .btn.btn-primary,
    .layout-main-section .lite-ops-support-link.btn.btn-default {
      border-color: #1d4454 !important;
      background: #1d4454 !important;
      color: #ffffff !important;
    }

    .layout-main-section .lite-ops-card .btn.btn-default {
      border-color: #d6e0e6 !important;
      background: #eef4f7 !important;
      color: #17313d !important;
    }

    .layout-main-section .lite-ops-support-links {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.7rem !important;
    }

    .layout-main-section .lite-ops-support-link {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 42px !important;
      padding-inline: 0.95rem !important;
    }

    @media (max-width: 991px) {
      .layout-main-section .lite-ops-page {
        padding: 1rem !important;
        border-radius: 22px !important;
      }

      .layout-main-section .lite-ops-hero {
        padding: 1.25rem !important;
      }

      .layout-main-section .lite-ops-card {
        min-height: 220px !important;
      }
    }

    @media (max-width: 640px) {
      .layout-main-section .lite-ops-hero h1 {
        font-size: 2rem !important;
      }

      .layout-main-section .lite-ops-section-header h2 {
        font-size: 1.5rem !important;
      }

      .layout-main-section .lite-ops-card h3 {
        font-size: 1.45rem !important;
      }

      .layout-main-section .lite-ops-card-footer {
        align-items: start !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function observe_legacy_company_switcher(pageState) {
  if (pageState.switcherObserver || !window.MutationObserver) {
    return;
  }

  pageState.switcherObserver = new MutationObserver(() => {
    remove_legacy_company_switcher();
  });

  pageState.switcherObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function remove_legacy_company_switcher() {
  document.querySelectorAll(".lite-ops-company-switcher").forEach((node) => node.remove());
}

function fetch_lite_context(force = false) {
  if (window.erpnext_lite_ops?.fetchContext) {
    return window.erpnext_lite_ops.fetchContext(force);
  }

  return frappe
    .call({
      method: "erpnext_lite_ops.api.get_context_payload",
    })
    .then((response) => response.message)
    .catch(() => null);
}

function open_list_view(doctype) {
  if (window.erpnext_lite_ops?.openList) {
    window.erpnext_lite_ops.openList(doctype);
    return;
  }

  frappe.set_route("List", doctype, "List");
}

function open_new_doc(doctype) {
  if (window.erpnext_lite_ops?.openNew) {
    window.erpnext_lite_ops.openNew(doctype);
    return;
  }

  if (frappe.new_doc) {
    frappe.new_doc(doctype);
    return;
  }

  frappe.set_route("Form", doctype, "new");
}

function open_pos_route() {
  remove_legacy_company_switcher();

  if (window.erpnext_lite_ops?.openPos) {
    window.erpnext_lite_ops.openPos();
    return;
  }

  if (frappe.set_route) {
    frappe.set_route("point-of-sale");
    return;
  }

  window.location.href = "/app/point-of-sale";
}

function render_lite_operations(context) {
  const sections = (context.sections || [])
    .map((section) => {
      const cards = (section.items || [])
        .map((item) => {
          const description = item.description || __("Acceso rapido a este flujo operativo.");

          return `
            <article class="lite-ops-card">
              <div class="lite-ops-card-copy">
                <h3>${frappe.utils.escape_html(item.label)}</h3>
                <p>${frappe.utils.escape_html(description)}</p>
              </div>
              <div class="lite-ops-card-footer">
                <div class="lite-ops-count">${frappe.format(item.count || 0, { fieldtype: "Int" })}</div>
                <div class="lite-ops-actions">
                  <button class="btn btn-default btn-sm" data-open-list="${frappe.utils.escape_html(item.doctype)}">
                    ${__("Abrir lista")}
                  </button>
                  <button class="btn btn-primary btn-sm" data-open-new="${frappe.utils.escape_html(item.doctype)}">
                    ${__("Nuevo")}
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");

      return `
        <section class="lite-ops-section">
          <div class="lite-ops-section-header">
            <div>
              <h2>${frappe.utils.escape_html(section.label)}</h2>
              <p>${frappe.utils.escape_html(section.description)}</p>
            </div>
          </div>
          <div class="lite-ops-card-grid">${cards}</div>
        </section>
      `;
    })
    .join("");

  const supportLinks = (context.support_links || [])
    .map((link) => {
      return `
        <button class="lite-ops-support-link btn btn-default btn-sm" data-open-list="${frappe.utils.escape_html(link.doctype)}">
          ${frappe.utils.escape_html(link.label)}
        </button>
      `;
    })
    .join("");

  return `
    <div class="lite-ops-page">
      <section class="lite-ops-hero">
        <div class="lite-ops-hero-copy">
          <span class="lite-ops-kicker">${__("Ventas, compras y caja")}</span>
          <h1>${frappe.utils.escape_html(context.app_label || "Operaciones Lite")}</h1>
          <p>
            Vista operativa simplificada para trabajar rapido con ventas, compras y caja sin cargar toda la interfaz estandar de ERPNext.
          </p>
        </div>
        <div class="lite-ops-hero-actions">
          <button class="btn btn-primary btn-lg" data-open-pos="1">${__("Abrir Caja")}</button>
          <button class="btn btn-default btn-lg" data-open-new="Quotation">${__("Nuevo presupuesto")}</button>
        </div>
      </section>

      <div class="lite-ops-sections">
        ${sections}
        <section class="lite-ops-section">
          <div class="lite-ops-section-header">
            <div>
              <h2>Registros de apoyo</h2>
              <p>Registros secundarios accesibles desde contexto o directamente cuando haga falta.</p>
            </div>
          </div>
          <div class="lite-ops-support-links">${supportLinks}</div>
        </section>
      </div>
    </div>
  `;
}
