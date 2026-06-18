/**
 * reportes.js — Estadísticas y gráficos del inventario
 * Reportes | ITU UNCUYO
 */

;(function () {
  "use strict";

  // ── Inventory data (shared from dashboard via localStorage) ──
  const DEFAULT_INVENTARIO = [
    { codigo: "INV-2024-001", nombre: "Multímetro digital Fluke 117", categoria: "instrumentacion", fisicas: "portatil", stock: { actual: 4, minimo: 2, estado: "disponible" } },
    { codigo: "INV-2024-014", nombre: "Osciloscopio 4 canales 100 MHz", categoria: "instrumentacion", fisicas: "mesa", stock: { actual: 2, minimo: 2, estado: "revision" } },
    { codigo: "INV-2023-089", nombre: "Notebook Dell Latitude 5540", categoria: "informatica", fisicas: "portatil", stock: { actual: 18, minimo: 5, estado: "disponible" } },
    { codigo: "INV-2022-201", nombre: "Escritorio regulable 140×70 cm", categoria: "mobiliario", fisicas: "voluminoso", stock: { actual: 1, minimo: 3, estado: "revision" } },
    { codigo: "INV-2021-045", nombre: "Proyector Epson EB-L200F", categoria: "audiovisual", fisicas: "fijo", stock: { actual: 1, minimo: 1, estado: "disponible" } },
    { codigo: "INV-2020-112", nombre: "Taladro percutor industrial", categoria: "herramientas", fisicas: "portatil", stock: { actual: 3, minimo: 2, estado: "disponible" } },
    { codigo: "INV-2019-078", nombre: "Servidor rack 2U HP ProLiant", categoria: "informatica", fisicas: "rack", stock: { actual: 0, minimo: 1, estado: "agotado" } },
    { codigo: "INV-2024-033", nombre: "Silla ergonómica oficina", categoria: "mobiliario", fisicas: "voluminoso", stock: { actual: 0, minimo: 4, estado: "agotado" } },
  ];

  const CATEGORY_LABELS = {
    instrumentacion: "Instrumentación",
    informatica: "Informática",
    mobiliario: "Mobiliario",
    audiovisual: "Audiovisual",
    herramientas: "Herramientas",
  };

  const CATEGORY_COLORS = {
    instrumentacion: "#0a3f43",
    informatica: "#1a7a82",
    mobiliario: "#e65100",
    audiovisual: "#7b1fa2",
    herramientas: "#2e7d32",
  };

  const STOCK_LABELS = {
    disponible: "Disponible",
    revision: "Pendiente de revisión",
    agotado: "Agotado",
  };

  // Load from localStorage
  let inventario;
  try {
    const saved = localStorage.getItem("itu_inventario");
    inventario = saved ? JSON.parse(saved) : [...DEFAULT_INVENTARIO];
  } catch (e) {
    inventario = [...DEFAULT_INVENTARIO];
  }

  // ── Stats cards ──
  function updateStats() {
    const total = inventario.length;
    const disponibles = inventario.filter(i => i.stock.estado === "disponible").length;
    const revision = inventario.filter(i => i.stock.estado === "revision").length;
    const agotados = inventario.filter(i => i.stock.estado === "agotado").length;
    const units = inventario.reduce((sum, i) => sum + (i.stock.actual || 0), 0);

    animateCounter("stat-total", total);
    animateCounter("stat-disponible", disponibles);
    animateCounter("stat-revision", revision);
    animateCounter("stat-agotado", agotados);
    animateCounter("stat-units", units);
  }

  function animateCounter(id, target) {
    const el = document.getElementById(id);
    const duration = 600;
    const start = performance.now();
    const from = 0;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Donut chart (SVG) ──
  function renderDonutChart() {
    const svg = document.getElementById("donut-svg");
    const legend = document.getElementById("chart-legend-cat");

    // Count by category
    const counts = {};
    inventario.forEach(item => {
      counts[item.categoria] = (counts[item.categoria] || 0) + 1;
    });

    const total = inventario.length;
    if (total === 0) return;

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const cx = 100, cy = 100, r = 70;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    svg.innerHTML = "";

    // Background circle
    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("cx", cx);
    bgCircle.setAttribute("cy", cy);
    bgCircle.setAttribute("r", r);
    bgCircle.setAttribute("stroke", "var(--itu-borde, #d5d5d5)");
    bgCircle.setAttribute("stroke-width", "30");
    bgCircle.setAttribute("fill", "none");
    svg.appendChild(bgCircle);

    entries.forEach(([cat, count]) => {
      const fraction = count / total;
      const dashLength = fraction * circumference;
      const dashGap = circumference - dashLength;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", r);
      circle.setAttribute("stroke", CATEGORY_COLORS[cat] || "#888");
      circle.setAttribute("stroke-width", "30");
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke-dasharray", `${dashLength} ${dashGap}`);
      circle.setAttribute("stroke-dashoffset", `${-offset}`);
      circle.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
      circle.style.transition = "stroke-dashoffset 0.6s ease";

      svg.appendChild(circle);
      offset += dashLength;
    });

    // Center text
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", cx);
    text.setAttribute("y", cy - 6);
    text.setAttribute("class", "donut-center-text");
    text.textContent = total;
    svg.appendChild(text);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", cx);
    label.setAttribute("y", cy + 12);
    label.setAttribute("class", "donut-center-label");
    label.textContent = "OBJETOS";
    svg.appendChild(label);

    // Legend
    legend.innerHTML = "";
    entries.forEach(([cat, count]) => {
      const li = document.createElement("li");
      li.className = "chart-legend__item";
      li.innerHTML = `
        <span class="chart-legend__dot" style="background:${CATEGORY_COLORS[cat] || '#888'}"></span>
        ${CATEGORY_LABELS[cat] || cat}
        <span class="chart-legend__count">${count}</span>
      `;
      legend.appendChild(li);
    });
  }

  // ── Bar chart ──
  function renderBarChart() {
    const container = document.getElementById("bar-chart");

    // Stock sum by category
    const stockByCat = {};
    inventario.forEach(item => {
      stockByCat[item.categoria] = (stockByCat[item.categoria] || 0) + (item.stock.actual || 0);
    });

    const entries = Object.entries(stockByCat).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);

    container.innerHTML = "";

    entries.forEach(([cat, val]) => {
      const pct = (val / maxVal) * 100;
      const group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = `
        <div class="bar-track">
          <div class="bar-fill" style="height:${pct}%;background:${CATEGORY_COLORS[cat] || '#888'}">
            <span class="bar-fill__value">${val} u.</span>
          </div>
        </div>
        <span class="bar-label">${CATEGORY_LABELS[cat] || cat}</span>
      `;
      container.appendChild(group);
    });

    // Animate bars in
    setTimeout(() => {
      container.querySelectorAll(".bar-fill").forEach(bar => {
        const h = bar.style.height;
        bar.style.height = "0%";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.height = h;
          });
        });
      });
    }, 50);
  }

  // ── Low stock alerts table ──
  function renderAlerts() {
    const tbody = document.getElementById("alerts-tbody");
    const emptyState = document.getElementById("alerts-empty");

    // Items where actual <= minimo OR estado is agotado/revision
    const alerts = inventario
      .filter(i => i.stock.actual <= i.stock.minimo || i.stock.estado !== "disponible")
      .sort((a, b) => a.stock.actual - b.stock.actual);

    tbody.innerHTML = "";

    if (alerts.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    alerts.forEach(item => {
      const tr = document.createElement("tr");
      tr.className = `inventory-row inventory-row--${item.stock.estado}`;
      tr.innerHTML = `
        <td style="font-weight:600;color:var(--itu-texto)">${escapeHtml(item.nombre)}</td>
        <td style="font-size:0.8125rem;color:var(--itu-texto-secundario)">${CATEGORY_LABELS[item.categoria] || item.categoria}</td>
        <td style="font-weight:700;color:var(--itu-texto)">${item.stock.actual} u.</td>
        <td style="font-size:0.8125rem;color:var(--itu-texto-suave)">${item.stock.minimo} u.</td>
        <td>
          <span class="stock-indicator" style="
            background:var(--stock-${item.stock.estado}-bg);
            color:var(--stock-${item.stock.estado});
            display:inline-flex;align-items:center;gap:0.35rem;
            padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--stock-${item.stock.estado})" ></span>
            ${STOCK_LABELS[item.stock.estado]}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Init ──
  updateStats();
  renderDonutChart();
  renderBarChart();
  renderAlerts();
})();
