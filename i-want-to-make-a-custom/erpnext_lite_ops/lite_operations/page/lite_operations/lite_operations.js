frappe.pages["lite-operations"] = frappe.pages["lite-operations"] || {};

frappe.pages["lite-operations"].on_page_load = function (wrapper) {
  const page = frappe.ui.make_app_page({
    parent: wrapper,
    title: __("Operaciones Lite"),
    single_column: true,
  });

  frappe.pages["lite-operations"].page = page;
  frappe.pages["lite-operations"].wrapper = wrapper;
};

frappe.pages["lite-operations"].on_page_show = function (wrapper) {
  const pageState = frappe.pages["lite-operations"];
  const page = pageState.page;
  const $target = $(wrapper).find(".layout-main-section");

  page.set_primary_action(__("New Presupuesto"), () => {
    erpnext_lite_ops.openNew("Quotation");
  });

  $target.html(`<div class="text-muted">${__("Loading simplified workspace...")}</div>`);

  erpnext_lite_ops.fetchContext(true).then((context) => {
    if (!context) {
      $target.html(`<div class="text-danger">${__("You do not have access to this workspace.")}</div>`);
      return;
    }

    $target.html(render_lite_operations(context));

    $target.find("[data-open-list]").on("click", function () {
      erpnext_lite_ops.openList($(this).data("open-list"));
    });

    $target.find("[data-open-new]").on("click", function () {
      erpnext_lite_ops.openNew($(this).data("open-new"));
    });
  });
};

function render_lite_operations(context) {
  const heroCards = (context.companies || [])
    .map((company) => {
      const active = company.name === context.active_company ? "Activo" : "Permitido";
      return `
        <span class="lite-ops-chip">
          <span>${frappe.utils.escape_html(company.label)}</span>
          <span>${active}</span>
        </span>
      `;
    })
    .join("");

  const sections = (context.sections || [])
    .map((section) => {
      const cards = (section.items || [])
        .map((item) => {
          const description = item.company_scoped
            ? `Empresa actual: ${frappe.utils.escape_html(context.active_company || "-")}`
            : "Disponible para todas las empresas permitidas.";

          return `
            <article class="lite-ops-card">
              <h3>${frappe.utils.escape_html(item.label)}</h3>
              <p>${description}</p>
              <div class="lite-ops-count">${frappe.format(item.count || 0, { fieldtype: "Int" })}</div>
              <div class="lite-ops-actions">
                <button class="btn btn-default btn-sm" data-open-list="${frappe.utils.escape_html(item.doctype)}">
                  ${__("Open list")}
                </button>
                <button class="btn btn-primary btn-sm" data-open-new="${frappe.utils.escape_html(item.doctype)}">
                  ${__("New")}
                </button>
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
      <div class="lite-ops-hero">
        <section class="lite-ops-panel">
          <h1>${frappe.utils.escape_html(context.app_label || "Operaciones Lite")}</h1>
          <p>
            Vista operativa simplificada para usuarios que trabajan con ventas y compras sin cargar toda la interfaz estandar de ERPNext.
          </p>
          <div class="lite-ops-chip-row">${heroCards}</div>
        </section>
        <section class="lite-ops-panel lite-ops-secondary-panel">
          <h2>${__("Current company")}</h2>
          <div class="lite-ops-count">${frappe.utils.escape_html(context.active_company || "-")}</div>
          <p class="muted">
            El selector fijo de la esquina superior cambia listas, valores por defecto y acceso a documentos con campo <code>company</code>.
          </p>
        </section>
      </div>

      <div class="lite-ops-sections">
        ${sections}
        <section class="lite-ops-section">
          <div class="lite-ops-section-header">
            <div>
              <h2>Apoyos rapidos</h2>
              <p>Registros secundarios accesibles desde contexto o directamente cuando haga falta.</p>
            </div>
          </div>
          <div class="lite-ops-support-links">${supportLinks}</div>
        </section>
      </div>
    </div>
  `;
}
