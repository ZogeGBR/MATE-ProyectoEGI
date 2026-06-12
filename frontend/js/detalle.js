/**
 * detalle.js — Vista de detalle del producto
 * Control de Inventario Interno | ITU UNCUYO
 * -----------------------------------------------
 * Maneja:
 *   • Carga del producto desde query param (?mongo_id=... o ?codigo=...)
 *   • Datos estructurales desde localStorage (MySQL vía dashboard)
 *   • Datos de hardware (specs) desde MongoDB vía /api/equipos/:mongo_id
 *   • Renderizado de specs editables inline
 *   • Toggle edición de características técnicas
 *   • Control de stock con meter visual en tiempo real
 *   • Guardar / Descartar cambios con notificación toast
 */

;(function () {
  "use strict";

  // ── INVENTARIO_DEMO se rellena desde localStorage (cargado por dashboard.js) ──
  // Si el usuario llega directamente a detalle.html sin pasar por el dashboard,
  // el array estará vacío y el fallback de la API se encargará.
  const INVENTARIO_DEMO = [];

  const STOCK_LABELS = {
    disponible: "Disponible",
    revision: "Pendiente de revisión",
    agotado: "Agotado",
  };

  const CATEGORY_LABELS = {
    instrumentacion: "Instrumentación",
    informatica: "Informática",
    mobiliario: "Mobiliario",
    audiovisual: "Audiovisual",
    herramientas: "Herramientas",
  };

  const TYPE_LABELS = {
    portatil: "Portátil",
    mesa: "De mesa",
    voluminoso: "Voluminoso",
    fijo: "Instalación fija",
    rack: "Rack / gabinete",
  };

  // ── DOM refs ──
  const detailCode = document.getElementById("detail-code");
  const detailImg = document.getElementById("detail-img");
  const detailBadge = document.getElementById("detail-badge");
  const detailBadgeText = document.getElementById("detail-badge-text");
  const detailCategory = document.getElementById("detail-category");
  const detailType = document.getElementById("detail-type");
  const detailName = document.getElementById("detail-name");
  const detailDesc = document.getElementById("detail-desc");
  const specList = document.getElementById("spec-list");
  const panelSpecs = document.getElementById("panel-specs");
  const btnEditSpecs = document.getElementById("btn-edit-specs");
  const btnEditSpecsLabel = document.getElementById("btn-edit-specs-label");
  const stockActual = document.getElementById("stock-actual");
  const stockMinimo = document.getElementById("stock-minimo");
  const stockEstado = document.getElementById("stock-estado");
  const stockUbicacion = document.getElementById("stock-ubicacion");
  const stockMeterFill = document.getElementById("stock-meter-fill");
  const stockMeterMax = document.getElementById("stock-meter-max");
  const btnSave = document.getElementById("btn-save");
  const btnDiscard = document.getElementById("btn-discard");
  const toastEl = document.getElementById("detail-toast");
  const toastMsg = document.getElementById("toast-msg");

  // Notes DOM refs
  const notesList = document.getElementById("notes-list");
  const notesCount = document.getElementById("notes-count");
  const notesEmpty = document.getElementById("notes-empty");
  const noteType = document.getElementById("note-type");
  const noteInput = document.getElementById("note-input");
  const btnAddNote = document.getElementById("btn-add-note");

  // ── State ──
  let currentProduct = null;
  let isEditingSpecs = false;
  let originalStockValues = {};
  let activeNotes = [];

  // ── Spec field icons (inline SVG strings) ──
  const specIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/></svg>`;

  // ── Init ──
  function init() {
    loadInventory();

    const params  = new URLSearchParams(window.location.search);
    const mongoId = params.get("mongo_id");
    const codigo  = params.get("codigo");

    if (mongoId) {
      // Ruta principal: cargar desde MongoDB vía API
      cargarDesdeAPI(mongoId, codigo);
    } else if (codigo) {
      // Fallback: buscar en localStorage por numero_serie (código)
      currentProduct = INVENTARIO_DEMO.find((p) => p.codigo === codigo);
      if (currentProduct) {
        render(currentProduct);
        bindEvents();
      } else {
        mostrarErrorCarga("Equipo no encontrado. Volvé al inventario.");
      }
    } else {
      mostrarErrorCarga("No se especificó ningún equipo.");
    }
  }

  // ── Carga desde MongoDB vía /api/equipos/:mongo_id ──
  function cargarDesdeAPI(mongoId, codigoFallback) {
    // Mostrar estado de carga en campos clave
    if (detailName) detailName.textContent = "Cargando…";
    if (detailCode) detailCode.textContent = codigoFallback || "…";

    fetch("/api/equipos/" + encodeURIComponent(mongoId))
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (docMongo) {
          // Buscar los datos relacionales (ubicación, responsable, etc.)
          // desde localStorage (ya cargado por dashboard.js)
          const baseLocal = INVENTARIO_DEMO.find(function (p) {
            return p.mongo_id === mongoId || p.codigo === codigoFallback;
          });

          // Combinar datos: MySQL (base) + MongoDB (specs de hardware)
          currentProduct = construirProducto(docMongo, baseLocal, codigoFallback);

          render(currentProduct);
          bindEvents();
        })
        .catch(function (err) {
          console.error("Error cargando detalle desde MongoDB:", err);

          // Fallback: intentar renderizar con los datos locales solamente
          const baseLocal = INVENTARIO_DEMO.find(function (p) {
            return p.mongo_id === mongoId || p.codigo === codigoFallback;
          });

          if (baseLocal) {
            currentProduct = baseLocal;
            if (!currentProduct.specs) {
              currentProduct.specs = { "Info": "Datos de hardware no disponibles (sin conexión al servidor)" };
            }
            render(currentProduct);
            bindEvents();
            showToast("Mostrando datos parciales (sin conexión a MongoDB).");
          } else {
            mostrarErrorCarga("No se pudo cargar el equipo. Verificá la conexión.");
          }
        });
  }

  /**
   * Combina un documento de MongoDB con los datos relacionales de MySQL
   * (que vienen del localStorage poblado por dashboard.js) en un objeto
   * con el formato que espera render().
   *
   * El documento MongoDB puede tener cualquier estructura, por eso usamos
   * un mapeo flexible: todo lo que no sea _id se muestra como spec.
   */
  function construirProducto(docMongo, baseLocal, codigoFallback) {
    // Campos reservados de MongoDB que NO queremos mostrar como specs
    const camposInternos = new Set(["_id", "numero_serie", "id_equipo"]);

    // Extraer specs: todo campo de MongoDB que no sea interno
    const specs = {};
    for (const clave in docMongo) {
      if (!camposInternos.has(clave)) {
        // Formatear el nombre de clave: snake_case → Título legible
        const label = clave
            .replace(/_/g, " ")
            .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        const valor = docMongo[clave];
        // Mostrar objetos anidados como JSON compacto
        specs[label] = (typeof valor === "object" && valor !== null)
            ? JSON.stringify(valor)
            : String(valor);
      }
    }

    // Si no hay ningún spec, poner un placeholder
    if (Object.keys(specs).length === 0) {
      specs["Info"] = "Sin especificaciones técnicas cargadas";
    }

    return {
      // Identificadores
      codigo:    docMongo.numero_serie || codigoFallback || docMongo._id,
      mongo_id:  docMongo._id,

      // Presentación (desde MySQL/localStorage si está disponible)
      nombre:    baseLocal ? baseLocal.nombre    : (docMongo.numero_serie || "Equipo"),
      imagen:    baseLocal ? baseLocal.imagen    : "assets/thumbnails/placeholder.svg",
      resumen:   baseLocal ? baseLocal.resumen   : "Datos cargados desde MongoDB",
      categoria: baseLocal ? baseLocal.categoria : "informatica",
      fisicas:   baseLocal ? baseLocal.fisicas   : "mesa",
      ubicacion: baseLocal ? baseLocal.ubicacion : "—",

      // Stock (desde localStorage)
      stock: baseLocal ? baseLocal.stock : { actual: 1, minimo: 1, estado: "disponible" },

      // Specs técnicas reales (desde MongoDB)
      specs: specs,

      // Notas (desde localStorage si existen)
      notes: baseLocal ? (baseLocal.notes || []) : [],
    };
  }

  // ── Render full product ──
  function render(product) {
    // Top bar
    detailCode.textContent = product.codigo;
    document.title = `${product.nombre} | Control de Inventario — ITU UNCUYO`;

    // Image
    detailImg.src = product.imagen;
    detailImg.alt = `Imagen de ${product.nombre}`;

    // Badge
    const estado = product.stock.estado;
    detailBadge.className = `detail-image__badge detail-image__badge--${estado}`;
    detailBadgeText.textContent = STOCK_LABELS[estado];

    // Category & type
    detailCategory.textContent = CATEGORY_LABELS[product.categoria] || product.categoria;
    detailType.textContent = TYPE_LABELS[product.fisicas] || product.fisicas;

    // Name & description
    detailName.textContent = product.nombre;
    detailDesc.textContent = product.resumen;

    // Specs (datos reales de MongoDB)
    renderSpecs(product.specs);

    // Stock
    stockActual.value = product.stock.actual;
    stockMinimo.value = product.stock.minimo;
    stockEstado.value = product.stock.estado;
    stockUbicacion.value = product.ubicacion || "";

    // Render Notes
    activeNotes = JSON.parse(JSON.stringify(product.notes || []));
    renderNotes(activeNotes);

    saveOriginalStock();
    updateMeter();
  }

  // ── Render spec rows ──
  function renderSpecs(specs) {
    specList.innerHTML = "";

    for (const [key, val] of Object.entries(specs)) {
      const li = document.createElement("li");
      li.className = "spec-item";
      li.innerHTML = `
        <span class="spec-item__label">
          ${specIcon}
          ${escapeHtml(key)}
        </span>
        <span class="spec-item__value">${escapeHtml(val)}</span>
        <input
          type="text"
          class="spec-item__input"
          value="${escapeHtml(val)}"
          data-spec="${escapeHtml(key)}"
          aria-label="${escapeHtml(key)}"
        />
      `;
      specList.appendChild(li);
    }
  }

  // ── Toggle edit mode for specs ──
  function toggleEditSpecs() {
    isEditingSpecs = !isEditingSpecs;

    if (isEditingSpecs) {
      panelSpecs.classList.add("detail-panel--editing");
      btnEditSpecsLabel.textContent = "Listo";
    } else {
      // Commit input values to display
      const inputs = specList.querySelectorAll(".spec-item__input");
      inputs.forEach((input) => {
        const valueSpan = input.previousElementSibling;
        if (valueSpan) {
          valueSpan.textContent = input.value;
        }
        // Also update internal product data
        const specKey = input.dataset.spec;
        if (currentProduct.specs[specKey] !== undefined) {
          currentProduct.specs[specKey] = input.value;
        }
      });

      panelSpecs.classList.remove("detail-panel--editing");
      btnEditSpecsLabel.textContent = "Editar";
    }
  }

  // ── Stock meter ──
  function updateMeter() {
    const actual = parseInt(stockActual.value, 10) || 0;
    const minimo = parseInt(stockMinimo.value, 10) || 0;
    const estado = stockEstado.value;
    const cap = Math.max(minimo * 3, actual, 1);
    const pct = actual === 0 ? 0 : Math.min(100, Math.round((actual / cap) * 100));

    stockMeterFill.style.width = pct + "%";

    // Update fill color class
    stockMeterFill.className = "stock-control__meter-fill";
    stockMeterFill.classList.add(`stock-control__meter-fill--${estado}`);

    stockMeterMax.textContent = `Máx. estimado: ${cap}`;

    // Update badge in image
    detailBadge.className = `detail-image__badge detail-image__badge--${estado}`;
    detailBadgeText.textContent = STOCK_LABELS[estado];
  }

  // ── Save & Discard ──
  function saveOriginalStock() {
    originalStockValues = {
      actual: stockActual.value,
      minimo: stockMinimo.value,
      estado: stockEstado.value,
      ubicacion: stockUbicacion.value,
    };
  }

  function handleSave() {
    // Update internal product data
    currentProduct.stock.actual = parseInt(stockActual.value, 10) || 0;
    currentProduct.stock.minimo = parseInt(stockMinimo.value, 10) || 0;
    currentProduct.stock.estado = stockEstado.value;
    currentProduct.ubicacion = stockUbicacion.value;

    // Save active notes to current product
    currentProduct.notes = JSON.parse(JSON.stringify(activeNotes));

    saveOriginalStock();
    updateMeter();

    // Persistir en localStorage
    saveInventory();

    showToast("Cambios guardados correctamente.");
  }

  function handleDiscard() {
    stockActual.value = originalStockValues.actual;
    stockMinimo.value = originalStockValues.minimo;
    stockEstado.value = originalStockValues.estado;
    stockUbicacion.value = originalStockValues.ubicacion;

    // Reset notes to original state
    activeNotes = JSON.parse(JSON.stringify(currentProduct.notes || []));
    renderNotes(activeNotes);

    // Also reset specs
    if (isEditingSpecs) {
      toggleEditSpecs();
    }
    renderSpecs(currentProduct.specs);

    updateMeter();
    showToast("Cambios descartados.");
  }

  // ── Notes rendering and management ──
  const NOTE_BADGE_LABELS = {
    info: "ℹ️ Info",
    defecto: "⚠️ Defecto",
    reemplazo: "🔄 Reemplazo",
    mantenimiento: "🔧 Mantenimiento",
  };

  function renderNotes(notes) {
    const notesCountText = notes.length === 1 ? "1 nota" : `${notes.length} notas`;
    notesCount.textContent = notesCountText;

    // Remove existing notes elements, but keep the empty placeholder
    const items = notesList.querySelectorAll(".detail-notes__item");
    items.forEach(el => el.remove());

    if (notes.length === 0) {
      notesEmpty.style.display = "flex";
      return;
    }

    notesEmpty.style.display = "none";

    notes.forEach((note) => {
      const itemEl = document.createElement("div");
      itemEl.className = "detail-notes__item";
      itemEl.innerHTML = `
        <div class="detail-notes__item-header">
          <div class="detail-notes__item-left">
            <span class="detail-notes__item-badge detail-notes__item-badge--${escapeHtml(note.tipo)}">
              ${escapeHtml(NOTE_BADGE_LABELS[note.tipo] || note.tipo)}
            </span>
            <span class="detail-notes__item-date">${escapeHtml(note.fecha)}</span>
          </div>
          <button type="button" class="detail-notes__item-delete" aria-label="Eliminar nota">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
        <p class="detail-notes__item-text">${escapeHtml(note.texto)}</p>
      `;

      itemEl.querySelector(".detail-notes__item-delete").addEventListener("click", () => {
        handleDeleteNote(note.id);
      });

      notesList.appendChild(itemEl);
    });
  }

  function handleAddNote() {
    const text = noteInput.value.trim();
    if (!text) {
      showToast("Escribí algún texto para agregar la nota.");
      return;
    }

    const newNote = {
      id: Date.now(),
      tipo: noteType.value,
      texto: text,
      fecha: new Date().toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    activeNotes.push(newNote);
    noteInput.value = "";
    renderNotes(activeNotes);
  }

  function handleDeleteNote(noteId) {
    activeNotes = activeNotes.filter(n => n.id !== noteId);
    renderNotes(activeNotes);
  }

  // ── Inventory localStorage persistence ──
  function loadInventory() {
    const saved = localStorage.getItem("itu_inventario");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          INVENTARIO_DEMO.length = 0;
          parsed.forEach(item => INVENTARIO_DEMO.push(item));
        }
      } catch (e) { /* ignore parse errors */ }
    }
  }

  function saveInventory() {
    // Actualizar el item correspondiente en el array local
    const idx = INVENTARIO_DEMO.findIndex(function (p) {
      return p.mongo_id === currentProduct.mongo_id || p.codigo === currentProduct.codigo;
    });
    if (idx !== -1) {
      INVENTARIO_DEMO[idx] = currentProduct;
    }
    localStorage.setItem("itu_inventario", JSON.stringify(INVENTARIO_DEMO));
  }

  // ── Error de carga ──
  function mostrarErrorCarga(mensaje) {
    if (detailName) detailName.textContent = mensaje;
    if (detailCode) detailCode.textContent = "—";
    if (detailDesc) detailDesc.textContent = "Volvé al inventario y seleccioná un equipo.";
  }

  // ── Toast ──
  function showToast(message) {
    toastMsg.textContent = message;
    toastEl.classList.add("detail-toast--visible");

    setTimeout(() => {
      toastEl.classList.remove("detail-toast--visible");
    }, 3000);
  }

  // ── Helpers ──
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Bind events ──
  function bindEvents() {
    btnEditSpecs.addEventListener("click", toggleEditSpecs);
    btnSave.addEventListener("click", handleSave);
    btnDiscard.addEventListener("click", handleDiscard);
    btnAddNote.addEventListener("click", handleAddNote);

    // Enter adds note, Shift+Enter inputs newline
    noteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddNote();
      }
    });

    // Live meter update
    stockActual.addEventListener("input", updateMeter);
    stockMinimo.addEventListener("input", updateMeter);
    stockEstado.addEventListener("change", updateMeter);
  }

  // ── Boot ──
  init();
})();