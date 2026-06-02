/**
 * detalle.js — Vista de detalle del producto
 * Control de Inventario Interno | ITU UNCUYO
 * -----------------------------------------------
 * Maneja:
 *   • Carga del producto desde query param (?codigo=INV-2024-001)
 *   • Renderizado de specs editables inline
 *   • Toggle edición de características técnicas
 *   • Control de stock con meter visual en tiempo real
 *   • Guardar / Descartar cambios con notificación toast
 */

;(function () {
  "use strict";

  // ── Datos de demostración (mismos que dashboard.js) ──
  const INVENTARIO_DEMO = [
    {
      codigo: "INV-2024-001",
      nombre: "Multímetro digital Fluke 117",
      imagen: "assets/thumbnails/multimetro.svg",
      resumen:
        "Medición AC/DC hasta 600 V · True RMS · Portátil · Lab. Electricidad",
      categoria: "instrumentacion",
      fisicas: "portatil",
      stock: { actual: 4, minimo: 2, estado: "disponible" },
      ubicacion: "Lab. Electricidad",
      specs: {
        Marca: "Fluke",
        Modelo: "117",
        "Rango de tensión": "0.1 mV – 600 V",
        "Tipo de medición": "True RMS",
        "Resistencia máx.": "40 MΩ",
        "Capacitancia máx.": "100 μF",
        Alimentación: "Batería 9V",
        "Peso aprox.": "550 g",
      },
    },
    {
      codigo: "INV-2024-014",
      nombre: "Osciloscopio 4 canales 100 MHz",
      imagen: "assets/thumbnails/osciloscopio.svg",
      resumen:
        "4 canales · 100 MHz · De mesa · Lab. Electrónica — en préstamo activo",
      categoria: "instrumentacion",
      fisicas: "mesa",
      stock: { actual: 2, minimo: 2, estado: "revision" },
      ubicacion: "Lab. Electrónica",
      specs: {
        Marca: "Rigol",
        Modelo: "DS1104Z",
        Canales: "4",
        "Ancho de banda": "100 MHz",
        "Tasa de muestreo": "1 GSa/s",
        "Profundidad de memoria": "12 Mpts",
        Pantalla: "7\" TFT color",
        Alimentación: "220V AC",
      },
    },
    {
      codigo: "INV-2023-089",
      nombre: "Notebook Dell Latitude 5540",
      imagen: "assets/thumbnails/notebook.svg",
      resumen:
        "Intel i7 · 16 GB RAM · 512 GB SSD · Portátil · Sala de cómputo 3",
      categoria: "informatica",
      fisicas: "portatil",
      stock: { actual: 18, minimo: 5, estado: "disponible" },
      ubicacion: "Sala de cómputo 3",
      specs: {
        Marca: "Dell",
        Modelo: "Latitude 5540",
        Procesador: "Intel Core i7-1365U",
        "Memoria RAM": "16 GB DDR5",
        Almacenamiento: "512 GB NVMe SSD",
        Pantalla: "15.6\" FHD IPS",
        "Sistema operativo": "Windows 11 Pro",
        Conectividad: "Wi-Fi 6E, Bluetooth 5.3",
      },
    },
    {
      codigo: "INV-2022-201",
      nombre: "Escritorio regulable 140×70 cm",
      imagen: "assets/thumbnails/escritorio.svg",
      resumen:
        "Superficie 140×70 cm · Altura regulable · Voluminoso · Depósito central",
      categoria: "mobiliario",
      fisicas: "voluminoso",
      stock: { actual: 1, minimo: 3, estado: "revision" },
      ubicacion: "Depósito central",
      specs: {
        Fabricante: "Genérico nacional",
        Dimensiones: "140 × 70 × 72-120 cm",
        Material: "MDF laminado + acero",
        "Altura regulable": "72 – 120 cm",
        "Capacidad de carga": "80 kg",
        Color: "Gris claro",
        "Pasacables integrado": "Sí",
        "Año de adquisición": "2022",
      },
    },
    {
      codigo: "INV-2021-045",
      nombre: "Proyector Epson EB-L200F",
      imagen: "assets/thumbnails/proyector.svg",
      resumen:
        "Láser 3.600 lm · HDMI/Wi-Fi · Instalación fija · Aula magna",
      categoria: "audiovisual",
      fisicas: "fijo",
      stock: { actual: 1, minimo: 1, estado: "disponible" },
      ubicacion: "Aula magna",
      specs: {
        Marca: "Epson",
        Modelo: "EB-L200F",
        Tecnología: "3LCD Láser",
        Brillo: "4.500 lúmenes",
        Resolución: "Full HD (1920×1080)",
        "Relación de contraste": "2.500.000:1",
        Conectividad: "HDMI, USB, Wi-Fi, Miracast",
        "Vida útil fuente": "20.000 horas",
      },
    },
    {
      codigo: "INV-2020-112",
      nombre: "Taladro percutor industrial",
      imagen: "assets/thumbnails/taladro.svg",
      resumen:
        "Percutor 800 W · Mandril 13 mm · Portátil · Taller mantenimiento",
      categoria: "herramientas",
      fisicas: "portatil",
      stock: { actual: 3, minimo: 2, estado: "disponible" },
      ubicacion: "Taller mantenimiento",
      specs: {
        Marca: "Bosch",
        Modelo: "GSB 20-2RE",
        Potencia: "800 W",
        Mandril: "13 mm (portabrocas rápido)",
        Velocidad: "0 – 3.000 RPM",
        "Impactos por min.": "51.000",
        Peso: "2.6 kg",
        Cable: "2.5 m",
      },
    },
    {
      codigo: "INV-2019-078",
      nombre: "Servidor rack 2U HP ProLiant",
      imagen: "assets/thumbnails/servidor.svg",
      resumen:
        "Rack 2U · 32 GB RAM · Sin unidades en depósito · Sala de servidores",
      categoria: "informatica",
      fisicas: "rack",
      stock: { actual: 0, minimo: 1, estado: "agotado" },
      ubicacion: "Sala de servidores",
      specs: {
        Marca: "HP",
        Modelo: "ProLiant DL380 Gen10",
        Procesador: "2× Intel Xeon Silver 4210",
        "Memoria RAM": "32 GB DDR4 ECC",
        Almacenamiento: "4× 600 GB SAS 10K",
        "Factor de forma": "2U Rack",
        Fuente: "2× 500W redundante",
        Controladora: "HPE Smart Array P408i-a",
      },
    },
    {
      codigo: "INV-2024-033",
      nombre: "Silla ergonómica oficina",
      imagen: "assets/thumbnails/silla.svg",
      resumen:
        "Respaldo regulable · Tapizado gris · Voluminoso · Secretaría académica",
      categoria: "mobiliario",
      fisicas: "voluminoso",
      stock: { actual: 0, minimo: 4, estado: "agotado" },
      ubicacion: "Secretaría académica",
      specs: {
        Fabricante: "Citiz",
        Tipo: "Ergonómica con apoyo lumbar",
        Material: "Malla transpirable + tapizado",
        "Regulación de altura": "Sí (neumática)",
        Apoyabrazos: "Regulable 3D",
        "Capacidad de carga": "120 kg",
        Color: "Gris oscuro",
        Ruedas: "5 ruedas de nylon",
      },
    },
  ];

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

  // ── State ──
  let currentProduct = null;
  let isEditingSpecs = false;
  let originalStockValues = {};

  // ── Spec field icons (inline SVG strings) ──
  const specIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/></svg>`;

  // ── Init ──
  function init() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("codigo") || "INV-2024-001";

    currentProduct = INVENTARIO_DEMO.find((p) => p.codigo === codigo);
    if (!currentProduct) {
      currentProduct = INVENTARIO_DEMO[0];
    }

    render(currentProduct);
    bindEvents();
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

    // Specs
    renderSpecs(product.specs);

    // Stock
    stockActual.value = product.stock.actual;
    stockMinimo.value = product.stock.minimo;
    stockEstado.value = product.stock.estado;
    stockUbicacion.value = product.ubicacion || "";

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

    saveOriginalStock();
    updateMeter();

    // TODO: Enviar datos al backend
    // fetch("/api/productos/" + currentProduct.codigo, { method: "PUT", ... })

    showToast("Cambios guardados correctamente.");
  }

  function handleDiscard() {
    stockActual.value = originalStockValues.actual;
    stockMinimo.value = originalStockValues.minimo;
    stockEstado.value = originalStockValues.estado;
    stockUbicacion.value = originalStockValues.ubicacion;

    // Also reset specs
    if (isEditingSpecs) {
      toggleEditSpecs();
    }
    renderSpecs(currentProduct.specs);

    updateMeter();
    showToast("Cambios descartados.");
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

    // Live meter update
    stockActual.addEventListener("input", updateMeter);
    stockMinimo.addEventListener("input", updateMeter);
    stockEstado.addEventListener("change", updateMeter);
  }

  // ── Boot ──
  init();
})();
