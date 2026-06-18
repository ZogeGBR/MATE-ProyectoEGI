/**
 * control.js — Gestión de usuarios y roles
 * Control de Acceso | ITU UNCUYO
 */

;(function () {
  "use strict";

  const USERS_DEMO = [
    { id: 1, nombre: "Carlos Mendoza", email: "cmendoza@itu.uncuyo.edu.ar", rol: "admin", estado: "activo", ultimoAcceso: "2026-06-10T14:30:00" },
    { id: 2, nombre: "María García", email: "mgarcia@itu.uncuyo.edu.ar", rol: "operador", estado: "activo", ultimoAcceso: "2026-06-10T09:15:00" },
    { id: 3, nombre: "Juan Pérez", email: "jperez@itu.uncuyo.edu.ar", rol: "operador", estado: "activo", ultimoAcceso: "2026-06-09T16:45:00" },
    { id: 4, nombre: "Ana Rodríguez", email: "arodriguez@itu.uncuyo.edu.ar", rol: "lectura", estado: "activo", ultimoAcceso: "2026-06-08T11:20:00" },
    { id: 5, nombre: "Lucas Fernández", email: "lfernandez@itu.uncuyo.edu.ar", rol: "lectura", estado: "inactivo", ultimoAcceso: "2026-05-20T08:00:00" },
    { id: 6, nombre: "Sofía López", email: "slopez@itu.uncuyo.edu.ar", rol: "admin", estado: "activo", ultimoAcceso: "2026-06-10T12:00:00" },
  ];

  const ROL_LABELS = { admin: "Administrador", operador: "Operador", lectura: "Solo lectura" };
  const ESTADO_LABELS = { activo: "Activo", inactivo: "Inactivo" };

  // Load from localStorage or use demo
  let users = JSON.parse(localStorage.getItem("itu_users") || "null") || [...USERS_DEMO];

  function saveUsers() {
    localStorage.setItem("itu_users", JSON.stringify(users));
  }

  // DOM
  const tbody = document.getElementById("users-tbody");
  const emptyState = document.getElementById("users-empty");
  const searchInput = document.getElementById("search-users");
  const filterRol = document.getElementById("filter-rol");
  const cardTotal = document.getElementById("card-total");
  const cardActivos = document.getElementById("card-activos");
  const cardInactivos = document.getElementById("card-inactivos");
  const btnAddUser = document.getElementById("btn-add-user");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose = document.getElementById("modal-close");
  const modalCancel = document.getElementById("modal-cancel");
  const formAddUser = document.getElementById("form-add-user");
  const modalError = document.getElementById("modal-error");
  const modalErrorMsg = document.getElementById("modal-error-msg");
  const toastEl = document.getElementById("control-toast");
  const toastMsgEl = document.getElementById("control-toast-msg");

  function normalize(t) {
    return String(t).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  function getInitials(name) {
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
  }

  function escapeHtml(t) {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  function filterUsers() {
    const query = normalize(searchInput.value.trim());
    const rol = filterRol.value;
    return users.filter(u => {
      if (rol && u.rol !== rol) return false;
      if (query) {
        const hay = normalize(u.nombre + " " + u.email);
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }

  function updateCards() {
    cardTotal.textContent = users.length;
    cardActivos.textContent = users.filter(u => u.estado === "activo").length;
    cardInactivos.textContent = users.filter(u => u.estado === "inactivo").length;
  }

  function renderTable() {
    const filtered = filterUsers();
    tbody.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filtered.forEach(user => {
      const tr = document.createElement("tr");
      tr.className = "inventory-row";
      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <div class="user-cell__avatar">${getInitials(user.nombre)}</div>
            <span class="user-cell__name">${escapeHtml(user.nombre)}</span>
          </div>
        </td>
        <td style="font-size:0.8125rem;color:var(--itu-texto-secundario)">${escapeHtml(user.email)}</td>
        <td><span class="role-badge role-badge--${user.rol}">${ROL_LABELS[user.rol]}</span></td>
        <td>
          <span class="status-badge status-badge--${user.estado}">
            <span class="status-badge__dot"></span>
            ${ESTADO_LABELS[user.estado]}
          </span>
        </td>
        <td><span class="access-date">${formatDate(user.ultimoAcceso)}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn" title="Alternar estado" data-action="toggle" data-id="${user.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button class="action-btn action-btn--danger" title="Eliminar usuario" data-action="delete" data-id="${user.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Bind action buttons
    tbody.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id, 10);
        if (btn.dataset.action === "toggle") toggleUser(id);
        if (btn.dataset.action === "delete") deleteUser(id);
      });
    });
  }

  function toggleUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    user.estado = user.estado === "activo" ? "inactivo" : "activo";
    saveUsers();
    updateCards();
    renderTable();
    showToast(`${user.nombre} ahora está ${ESTADO_LABELS[user.estado].toLowerCase()}.`);
  }

  function deleteUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    if (!confirm(`¿Eliminar a ${user.nombre}?`)) return;
    users = users.filter(u => u.id !== id);
    saveUsers();
    updateCards();
    renderTable();
    showToast(`${user.nombre} eliminado.`);
  }

  // Modal
  function openModal() {
    formAddUser.reset();
    modalError.hidden = true;
    modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("user-nombre").focus();
  }

  function closeModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  btnAddUser.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  modalCancel.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modalOverlay.hidden) closeModal(); });

  formAddUser.addEventListener("submit", e => {
    e.preventDefault();
    modalError.hidden = true;

    const nombre = document.getElementById("user-nombre").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const rol = document.getElementById("user-rol").value;
    const estado = document.getElementById("user-estado").value;

    if (!nombre) { showError("Ingresá el nombre completo."); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("Ingresá un email válido."); return; }
    if (!rol) { showError("Seleccioná un rol."); return; }

    const maxId = users.reduce((max, u) => Math.max(max, u.id), 0);
    users.push({
      id: maxId + 1,
      nombre,
      email,
      rol,
      estado,
      ultimoAcceso: new Date().toISOString(),
    });

    saveUsers();
    closeModal();
    updateCards();
    renderTable();
    showToast(`${nombre} agregado como ${ROL_LABELS[rol]}.`);
  });

  function showError(msg) {
    modalErrorMsg.textContent = msg;
    modalError.hidden = false;
    modalError.style.animation = "none";
    void modalError.offsetWidth;
    modalError.style.animation = "";
  }

  function showToast(message) {
    toastMsgEl.textContent = message;
    toastEl.classList.add("dashboard-toast--visible");
    setTimeout(() => toastEl.classList.remove("dashboard-toast--visible"), 3000);
  }

  // Events
  searchInput.addEventListener("input", renderTable);
  filterRol.addEventListener("change", renderTable);

  // Init
  updateCards();
  renderTable();
})();
