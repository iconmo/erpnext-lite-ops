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

  page.set_primary_action(__("Nuevo presupuesto"), () => {
    erpnext_lite_ops.openNew("Quotation");
  });

  page.set_secondary_action(__("Abrir POS"), () => {
    erpnext_lite_ops.openPos();
  });

  $target.html(`<div class="text-muted">${__("Cargando espacio simplificado...")}</div>`);

  erpnext_lite_ops.fetchContext(true).then((context) => {
    if (!context) {
      $target.html(`<div class="text-danger">${__("No tienes acceso a este espacio.")}</div>`);
      return;
    }

    $target.html(render_lite_operations(context));

    $target.find("[data-open-list]").on("click", function () {
      erpnext_lite_ops.openList($(this).data("open-list"));
    });

    $target.find("[data-open-new]").on("click", function () {
      erpnext_lite_ops.openNew($(this).data("open-new"));
    });

    $target.find("[data-open-pos]").on("click", function () {
      erpnext_lite_ops.openPos();
    });
  });
};

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
            Vista operativa simplificada para trabajar rapido con ventas, compras y punto de venta sin cargar toda la interfaz estandar de ERPNext.
          </p>
        </div>
        <div class="lite-ops-hero-actions">
          <button class="btn btn-primary btn-lg" data-open-pos="1">${__("Abrir POS")}</button>
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
