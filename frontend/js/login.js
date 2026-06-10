/**
 * login.js — Lógica del formulario de inicio de sesión
 * Control de Acceso Interno | ITU UNCUYO
 * -------------------------------------------------
 * Maneja:
 *   • Validación del formulario (email + contraseña)
 *   • Toggle de visibilidad de la contraseña
 *   • Estado de carga (spinner) al enviar
 *   • Mensaje de error con animación shake
 *   • Redirección al dashboard tras login exitoso
 */

;(function () {
  "use strict";

  // ── Elementos del DOM ──
  const form         = document.getElementById("login-form");
  const emailInput   = document.getElementById("login-email");
  const passwordInput= document.getElementById("login-password");
  const submitBtn    = document.getElementById("login-submit");
  const errorBox     = document.getElementById("login-error");
  const errorMsg     = document.getElementById("login-error-msg");
  const toggleBtn    = document.getElementById("toggle-password");
  const iconOpen     = document.getElementById("icon-eye-open");
  const iconClosed   = document.getElementById("icon-eye-closed");

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

    // Devolver el foco al campo
    passwordInput.focus();
  });

  // ── Helpers ──
  function showError(message) {
    errorMsg.textContent = message;
    errorBox.classList.add("login-error--visible");

    // Re-trigger shake animation
    errorBox.style.animation = "none";
    // Force reflow
    void errorBox.offsetWidth;
    errorBox.style.animation = "";
  }

  function hideError() {
    errorBox.classList.remove("login-error--visible");
  }

  function setLoading(loading) {
    if (loading) {
      submitBtn.classList.add("login-btn--loading");
      submitBtn.disabled = true;
    } else {
      submitBtn.classList.remove("login-btn--loading");
      submitBtn.disabled = false;
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ── Form submit ──
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // --- Client-side validation ---
    if (!email) {
      showError("Ingresá tu correo electrónico.");
      emailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showError("El formato del correo electrónico no es válido.");
      emailInput.focus();
      return;
    }

    if (!password) {
      showError("Ingresá tu contraseña.");
      passwordInput.focus();
      return;
    }

    if (password.length < 4) {
      showError("La contraseña debe tener al menos 4 caracteres.");
      passwordInput.focus();
      return;
    }

    // --- Simulate auth request ---
    setLoading(true);

    // TODO: Reemplazar con llamada real al backend (OpenLDAP)
    // Ejemplo:
    //   fetch("/api/login", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ email, password }),
    //   })
    //   .then(res => { ... })

    setTimeout(function () {
      setLoading(false);

      // Simulación: aceptar cualquier credencial válida
      // En producción esto se valida contra OpenLDAP
      const loginExitoso = true;

      if (loginExitoso) {
        // Guardar sesión del usuario
        const userName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        localStorage.setItem("itu_session_user", JSON.stringify({
          name: userName,
          email: email,
        }));
        // Redirigir al dashboard (inventario)
        window.location.href = "index.html";
      } else {
        showError("Credenciales incorrectas. Inténtalo de nuevo.");
      }
    }, 1200);
  });

  // ── Limpiar error al escribir ──
  emailInput.addEventListener("input", hideError);
  passwordInput.addEventListener("input", hideError);
})();
