/**
 * Dashboard — tabla de inventario con paginación y resumen por página.
 * Integración real con MySQL vía /api/equipos
 */

const PAGE_SIZE = 5;

// INVENTARIO_DEMO se mantiene como array mutable que se rellena desde la API.
// Toda la lógica de filtros, paginación y modal que ya existía sigue
// funcionando sin cambios porque opera sobre este mismo array.
const INVENTARIO_DEMO = [];

const STOCK_LABELS = {
  disponible: "Disponible",
  revision: "Pendiente de revisión",
  agotado: "Agotado",
};

const FILTER_LABELS = {
  categoria: {
    instrumentacion: "Instrumentación",
    informatica: "Informática",
    mobiliario: "Mobiliario",
    audiovisual: "Audiovisual",
    herramientas: "Herramientas",
  },
  fisicas: {
    portatil: "Portátil",
    mesa: "De mesa",
    voluminoso: "Voluminoso",
    fijo: "Instalación fija",
    rack: "Rack / gabinete",
  },
};

const searchInput = document.getElementById("search-inventory");
const filterEstado = document.getElementById("filter-estado");
const filterCategoria = document.getElementById("filter-categoria");
const filterFisicas = document.getElementById("filter-fisicas");
const btnClearFilters = document.getElementById("btn-clear-filters");
const tableBody = document.getElementById("inventory-tbody");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("table-empty");
const tableFooter = document.getElementById("table-footer");
const pageSummary = document.getElementById("page-summary");
const paginationPages = document.getElementById("pagination-pages");
const btnPagePrev = document.getElementById("btn-page-prev");
const btnPageNext = document.getElementById("btn-page-next");
const tableWrapper = document.querySelector(".table-scroll");

let currentPage = 1;

function normalize(text) {
  return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
}

function stockPercent(item) {
  const { actual, minimo } = item.stock;
  if (item.stock.estado === "agotado" || actual === 0) return 0;
  const cap = Math.max(minimo * 3, actual, 1);
  return Math.min(100, Math.round((actual / cap) * 100));
}

function matchesSearch(item, query) {
  if (!query) return true;
  const haystack = normalize(
      [
        item.codigo,
        item.nombre,
        item.resumen,
        FILTER_LABELS.categoria[item.categoria],
        FILTER_LABELS.fisicas[item.fisicas],
        STOCK_LABELS[item.stock.estado],
      ].join(" ")
  );
  return haystack.includes(normalize(query));
}

function filterItems() {
  const query = searchInput.value.trim();
  const estado = filterEstado.value;
  const categoria = filterCategoria.value;
  const fisicas = filterFisicas.value;

  return INVENTARIO_DEMO.filter((item) => {
    if (estado && item.stock.estado !== estado) return false;
    if (categoria && item.categoria !== categoria) return false;
    if (fisicas && item.fisicas !== fisicas) return false;
    return matchesSearch(item, query);
  });
}

function getTotalPages(itemCount) {
  return Math.max(1, Math.ceil(itemCount / PAGE_SIZE));
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function countByStockState(items) {
  const counts = { disponible: 0, revision: 0, agotado: 0 };
  items.forEach((item) => {
    counts[item.stock.estado] += 1;
  });
  return counts;
}

function formatStateBreakdown(counts) {
  const parts = [];
  if (counts.disponible > 0) {
    parts.push(
        `${counts.disponible} disponible${counts.disponible !== 1 ? "s" : ""}`
    );
  }
  if (counts.revision > 0) {
    parts.push(
        `${counts.revision} en revisión`
    );
  }
  if (counts.agotado > 0) {
    parts.push(`${counts.agotado} agotado${counts.agotado !== 1 ? "s" : ""}`);
  }
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} y ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} y ${parts[2]}`;
}

function buildPageSummary(pageItems, filteredTotal, page, totalPages) {
  const pageCount = pageItems.length;
  if (pageCount === 0) {
    return "No hay elementos para mostrar en esta página.";
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = start + pageCount - 1;
  const states = formatStateBreakdown(countByStockState(pageItems));
  const range =
      filteredTotal <= PAGE_SIZE
          ? `los <strong>${pageCount}</strong> elementos`
          : `los elementos <strong>${start}–${end}</strong> de <strong>${filteredTotal}</strong>`;

  let text = `En esta página se muestran ${range}`;
  if (totalPages > 1) {
    text += ` · Página <strong>${page}</strong> de <strong>${totalPages}</strong>`;
  }
  if (states) {
    text += ` <span class="summary-states">(${states})</span>`;
  }
  text += ".";

  return text;
}

function renderStockCell(item) {
  const { actual, minimo, estado } = item.stock;
  const pct = stockPercent(item);
  const label = STOCK_LABELS[estado];

  return `
    <div class="stock-cell stock-cell--${estado}">
      <div class="stock-cell__header">
        <span class="stock-indicator" aria-hidden="true">
          <span class="stock-indicator__dot"></span>
          <span class="stock-indicator__label">${escapeHtml(label)}</span>
        </span>
        <span class="stock-cell__qty">
          <strong>${actual}</strong>
          <span class="stock-cell__qty-unit"> u.</span>
        </span>
      </div>
      <div
        class="stock-meter"
        role="meter"
        aria-valuenow="${actual}"
        aria-valuemin="0"
        aria-valuemax="${Math.max(minimo * 3, minimo, 1)}"
        aria-label="${escapeHtml(label)}: ${actual} unidades, mínimo operativo ${minimo}"
      >
        <div class="stock-meter__track">
          <div class="stock-meter__fill" style="width: ${pct}%"></div>
        </div>
        <span class="stock-meter__hint">Mín. ${minimo}</span>
      </div>
    </div>
  `;
}

function renderRow(item) {
  const tr = document.createElement("tr");
  tr.className = `inventory-row inventory-row--${item.stock.estado}`;
  tr.dataset.codigo = item.codigo;
  tr.dataset.stockEstado = item.stock.estado;
  tr.style.cursor = "pointer";
  tr.title = `Ver detalle de ${item.nombre}`;

  tr.innerHTML = `
    <td class="col-thumb">
      <figure class="product-thumb">
        <img
          src="${escapeHtml(item.imagen)}"
          alt=""
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          onerror="this.src='assets/thumbnails/placeholder.svg'"
        />
      </figure>
    </td>
    <td class="col-producto">
      <span class="product-name">${escapeHtml(item.nombre)}</span>
      <span class="sr-only"> — estado: ${escapeHtml(STOCK_LABELS[item.stock.estado])}</span>
    </td>
    <td class="col-resumen">
      <p class="product-resumen">${escapeHtml(item.resumen)}</p>
    </td>
    <td class="col-stock">
      ${renderStockCell(item)}
    </td>
  `;

  const img = tr.querySelector("img");
  img.alt = `Imagen de ${item.nombre}`;

  // Navegar al detalle pasando el mongo_id para que detalle.js
  // pueda consultarlo en /api/equipos/:mongo_id
  tr.addEventListener("click", function () {
    window.location.href = `detalle.html?mongo_id=${encodeURIComponent(item.mongo_id)}&codigo=${encodeURIComponent(item.codigo)}`;
  });

  return tr;
}

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("…");
    }
    result.push(sorted[i]);
  }

  return result;
}

function renderPagination(totalPages) {
  paginationPages.replaceChildren();

  getPageNumbers(currentPage, totalPages).forEach((entry) => {
    if (entry === "…") {
      const li = document.createElement("li");
      li.className = "pagination-ellipsis";
      li.setAttribute("aria-hidden", "true");
      li.textContent = "…";
      paginationPages.appendChild(li);
      return;
    }

    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pagination-btn";
    btn.textContent = String(entry);

    if (entry === currentPage) {
      btn.classList.add("pagination-btn--active");
      btn.setAttribute("aria-current", "page");
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => goToPage(entry));
    }

    li.appendChild(btn);
    paginationPages.appendChild(li);
  });

  btnPagePrev.disabled = currentPage <= 1;
  btnPageNext.disabled = currentPage >= totalPages;
}

function goToPage(page) {
  const filtered = filterItems();
  const totalPages = getTotalPages(filtered.length);
  currentPage = Math.min(Math.max(1, page), totalPages);
  renderTable(false);
}

function renderTable(resetPage = false) {
  const filtered = filterItems();
  const filteredTotal = filtered.length;
  const totalPages = getTotalPages(filteredTotal);

  if (resetPage) {
    currentPage = 1;
  } else if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  tableBody.replaceChildren();
  pageItems.forEach((item) => tableBody.appendChild(renderRow(item)));

  const catalogTotal = INVENTARIO_DEMO.length;
  resultCount.textContent =
      filteredTotal === catalogTotal
          ? `${catalogTotal} equipos registrados`
          : `${filteredTotal} de ${catalogTotal} equipos`;

  const hasResults = filteredTotal > 0;
  emptyState.hidden = hasResults;
  tableWrapper.hidden = !hasResults;
  tableFooter.hidden = !hasResults;

  if (hasResults) {
    pageSummary.innerHTML = buildPageSummary(
        pageItems,
        filteredTotal,
        currentPage,
        totalPages
    );
    renderPagination(totalPages);
  }
}

function clearFilters() {
  searchInput.value = "";
  filterEstado.value = "";
  filterCategoria.value = "";
  filterFisicas.value = "";
  renderTable(true);
  searchInput.focus();
}

[searchInput, filterEstado, filterCategoria, filterFisicas].forEach((el) => {
  el.addEventListener("input", () => renderTable(true));
  el.addEventListener("change", () => renderTable(true));
});

btnClearFilters.addEventListener("click", clearFilters);
btnPagePrev.addEventListener("click", () => goToPage(currentPage - 1));
btnPageNext.addEventListener("click", () => goToPage(currentPage + 1));

// ========================================================
// PERSISTENCIA EN LOCALSTORAGE (se mantiene para el modal de agregar)
// ========================================================
function saveInventory() {
  localStorage.setItem("itu_inventario", JSON.stringify(INVENTARIO_DEMO));
}

// ========================================================
// CARGA DESDE LA API REAL (MySQL vía Flask)
// ========================================================

/**
 * Mapea una fila de SQL al formato que espera toda la lógica de UI.
 * Los campos que MongoDB no provee aún (categoria, fisicas, stock)
 * se inicializan con valores por defecto, listos para ser enriquecidos.
 */
function mapearEquipo(eq) {
  return {
    // Identificadores
    codigo:    eq.numero_serie,
    mongo_id:  eq.mongo_id,

    // Presentación
    nombre:    `Equipo ${eq.numero_serie}`,
    imagen:    "assets/thumbnails/placeholder.svg",
    resumen:   `${eq.laboratorio} · ${eq.aula} · Banco ${eq.numero_banco} · Resp: ${eq.nombre} ${eq.apellido}`,

    // Clasificación (valores por defecto; el Integrante 3 puede enriquecer
    // desde MongoDB en la vista de detalle)
    categoria: "informatica",
    fisicas:   "mesa",

    // Stock operativo básico
    stock: {
      actual: 1,
      minimo: 1,
      estado: "disponible",
    },

    // Datos extra útiles para detalle
    fecha_alta: eq.fecha_alta,
    ubicacion:  `${eq.laboratorio} — ${eq.aula}`,
  };
}

function cargarInventario() {
  // Mostrar estado de carga
  resultCount.textContent = "Cargando inventario…";

  fetch("/api/equipos")
      .then(function (res) {
        if (!res.ok) throw new Error("Error HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        // Limpiar el array y rellenarlo con datos reales
        INVENTARIO_DEMO.length = 0;
        data.forEach(function (eq) {
          INVENTARIO_DEMO.push(mapearEquipo(eq));
        });

        // Persistir en localStorage para que detalle.js también lo use
        saveInventory();

        renderTable(true);
      })
      .catch(function (err) {
        console.error("Error cargando inventario desde la API:", err);
        resultCount.textContent = "Error al cargar el inventario.";

        // Fallback: intentar cargar desde localStorage si hay datos previos
        const saved = localStorage.getItem("itu_inventario");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              INVENTARIO_DEMO.length = 0;
              parsed.forEach(function (item) { INVENTARIO_DEMO.push(item); });
              renderTable(true);
              showToast("Mostrando datos en caché (sin conexión al servidor).");
            }
          } catch (e) { /* ignorar errores de parseo */ }
        }
      });
}

// ========================================================
// ADD ITEM MODAL
// ========================================================
const btnAddItem = document.getElementById("btn-add-item");
const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const modalCancel = document.getElementById("modal-cancel");
const formAddItem = document.getElementById("form-add-item");
const modalError = document.getElementById("modal-error");
const modalErrorMsg = document.getElementById("modal-error-msg");
const newCodigo = document.getElementById("new-codigo");
const toastEl = document.getElementById("dashboard-toast");
const toastMsg = document.getElementById("dashboard-toast-msg");

function generateCode() {
  const year = new Date().getFullYear();
  const existing = INVENTARIO_DEMO
      .map(i => i.codigo)
      .filter(c => c.startsWith(`INV-${year}-`))
      .map(c => parseInt(c.split("-")[2], 10))
      .filter(n => !isNaN(n));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `INV-${year}-${String(next).padStart(3, "0")}`;
}

function openModal() {
  formAddItem.reset();
  modalError.hidden = true;
  newCodigo.value = generateCode();
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("new-nombre").focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

function showModalError(msg) {
  modalErrorMsg.textContent = msg;
  modalError.hidden = false;
  // Re-trigger shake
  modalError.style.animation = "none";
  void modalError.offsetWidth;
  modalError.style.animation = "";
}

function showToast(message) {
  toastMsg.textContent = message;
  toastEl.classList.add("dashboard-toast--visible");
  setTimeout(() => {
    toastEl.classList.remove("dashboard-toast--visible");
  }, 3000);
}

btnAddItem.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
});

formAddItem.addEventListener("submit", (e) => {
  e.preventDefault();
  modalError.hidden = true;

  const nombre = document.getElementById("new-nombre").value.trim();
  const categoria = document.getElementById("new-categoria").value;
  const fisicas = document.getElementById("new-fisicas").value;
  const resumen = document.getElementById("new-resumen").value.trim();
  const stockActual = parseInt(document.getElementById("new-stock").value, 10) || 0;
  const stockMinimo = parseInt(document.getElementById("new-minimo").value, 10) || 0;
  const stockEstado = document.getElementById("new-estado").value;

  if (!nombre) { showModalError("Ingresá el nombre del producto."); return; }
  if (!categoria) { showModalError("Seleccioná una categoría."); return; }
  if (!fisicas) { showModalError("Seleccioná las características físicas."); return; }
  if (!resumen) { showModalError("Ingresá una descripción o resumen."); return; }

  const newItem = {
    codigo: newCodigo.value,
    mongo_id: null,
    nombre,
    imagen: "assets/thumbnails/placeholder.svg",
    resumen,
    categoria,
    fisicas,
    stock: { actual: stockActual, minimo: stockMinimo, estado: stockEstado },
  };

  INVENTARIO_DEMO.push(newItem);
  saveInventory();
  closeModal();
  renderTable(true);
  showToast(`"${nombre}" agregado al inventario.`);
});

// ── Arranque: cargar datos reales desde la API ──
cargarInventario();