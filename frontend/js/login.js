/**
 * login.js — Lógica del formulario de inicio de sesión
 * Control de Acceso Interno | ITU UNCUYO
 * -------------------------------------------------
 * Autenticación real contra OpenLDAP vía /api/login.
 * El servidor devuelve un JWT que se guarda en localStorage ("itu_jwt").
 * Todas las rutas protegidas (dashboard, detalle) verifican este token
 * antes de hacer cualquier fetch a /api/*.
 */

;(function () {
  "use strict";

  // ── Si ya hay un JWT válido guardado, redirigir directo al dashboard ──
  if (localStorage.getItem("itu_jwt")) {
    window.location.href = "index.html";
    return;
  }

  // ── Elementos del DOM ──
  const form          = document.getElementById("login-form");
  const emailInput    = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const submitBtn     = document.getElementById("login-submit");
  const errorBox      = document.getElementById("login-error");
  const errorMsg      = document.getElementById("login-error-msg");
  const toggleBtn     = document.getElementById("toggle-password");
  const iconOpen      = document.getElementById("icon-eye-open");
  const iconClosed    = document.getElementById("icon-eye-closed");

  // ── Toggle password visibility ──
  toggleBtn.addEventListener("click", function () {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    iconOpen.style.display   = isPassword ? "none"  : "block";
    iconClosed.style.display = isPassword ? "block" : "none";
    toggleBtn.setAttribute(
      "aria-label",
      isPassword ? "Ocultar contraseña" : "Mostrar contraseña"
    );
    passwordInput.focus();
  });

  function showError(message) {
    errorMsg.textContent = message;
    errorBox.classList.add("login-error--visible");
    errorBox.style.animation = "none";
    void errorBox.offsetWidth;
    errorBox.style.animation = "";
  }

  function hideError() {
    errorBox.classList.remove("login-error--visible");
  }

  function setLoading(loading) {
    submitBtn.classList.toggle("login-btn--loading", loading);
    submitBtn.disabled = loading;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) { showError("Ingresá tu correo electrónico."); emailInput.focus(); return; }
    if (!isValidEmail(email)) { showError("El formato del correo no es válido."); emailInput.focus(); return; }
    if (!password) { showError("Ingresá tu contraseña."); passwordInput.focus(); return; }
    if (password.length < 4) { showError("La contraseña debe tener al menos 4 caracteres."); passwordInput.focus(); return; }

    setLoading(true);

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data }; });
      })
      .then(function ({ ok, data }) {
        setLoading(false);
        if (ok && data.ok) {
          // Guardar JWT y datos del usuario
          localStorage.setItem("itu_jwt", data.token);
          const userName = (data.user || email.split("@")[0])
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
          localStorage.setItem("itu_session_user", JSON.stringify({
            name: userName, email: email, rol: data.rol,
          }));
          window.location.href = "index.html";
        } else {
          showError(data.error || "Credenciales incorrectas.");
        }
      })
      .catch(function () {
        setLoading(false);
        showError("Error de conexión con el servidor.");
      });
  });

  emailInput.addEventListener("input", hideError);
  passwordInput.addEventListener("input", hideError);
})();
