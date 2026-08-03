/* BOLETIX — Entrar y crear cuenta */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const next = UI.param("next");
  function go(user) {
    location.href = next ? decodeURIComponent(next) : BX.app.homeFor(user);
  }

  /* Rejilla de dos columnas en escritorio */
  const grid = document.getElementById("lg-grid") || document.getElementById("rg-grid");
  if (grid) {
    const mq = window.matchMedia("(min-width: 900px)");
    const apply = () => { grid.style.gridTemplateColumns = mq.matches ? "minmax(0,1fr) 340px" : "1fr"; };
    apply();
    mq.addEventListener("change", apply);
  }

  /* ================= ENTRAR ================= */
  const lgForm = document.getElementById("lg-form");
  if (lgForm) {
    const already = S.session();
    if (already && !next) {
      UI.toast("Ya tenías sesión abierta como " + already.name);
    }

    const eye = document.getElementById("lg-eye");
    const pass = document.getElementById("lg-pass");
    eye.innerHTML = UI.icon("eye", 18);
    eye.addEventListener("click", function () {
      const show = pass.type === "password";
      pass.type = show ? "text" : "password";
      eye.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    });

    lgForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const mail = document.getElementById("lg-mail").value.trim();
      const pw = pass.value;
      if (!mail) { UI.toast("Escribe tu correo.", "err"); return; }
      if (!pw) { UI.toast("Escribe tu contraseña.", "err"); return; }
      const r = S.login(mail, pw);
      if (!r.ok) { UI.toast(r.error, "err"); return; }
      UI.toast("Hola de nuevo, " + r.user.name.split(" ")[0], "ok");
      setTimeout(() => go(r.user), 450);
    });

    const roleInfo = {
      fan: ["Comprador", "Compra boletos, ve su QR dinámico, revende y pide reembolsos."],
      promotor: ["Promotor B2B", "Publica eventos, ve ventas en vivo y su liquidación."],
      admin: ["Administrador", "Aprueba eventos, atiende incidencias y ve las finanzas de la plataforma."],
      staff: ["Personal de puerta", "Valida accesos con la app de escaneo."],
    };
    document.getElementById("lg-demo").innerHTML = BX.USERS.map(function (u) {
      const r = roleInfo[u.role];
      return '<button class="card card-flat" data-mail="' + u.email + '" style="text-align:left;cursor:pointer;width:100%">' +
        '<div class="row between" style="gap:var(--s3)">' +
        '<div class="stack stack-1 grow" style="min-width:0">' +
        '<div class="row" style="gap:var(--s2)"><span class="badge badge-rosa">' + r[0] + "</span></div>" +
        '<strong class="t-sm">' + UI.esc(u.name) + "</strong>" +
        '<span class="t-xs txt-3">' + r[1] + "</span>" +
        '<span class="t-xs mono txt-3">' + u.email + "</span>" +
        "</div>" +
        '<span class="txt-3" style="flex:none">' + UI.icon("right", 16) + "</span>" +
        "</div></button>";
    }).join("");

    document.getElementById("lg-demo").addEventListener("click", function (e) {
      const b = e.target.closest("[data-mail]");
      if (!b) return;
      document.getElementById("lg-mail").value = b.dataset.mail;
      pass.value = "boletix123";
      const r = S.login(b.dataset.mail, "boletix123");
      if (r.ok) {
        UI.toast("Entraste como " + r.user.name, "ok");
        setTimeout(() => go(r.user), 450);
      }
    });
  }

  /* ================= CREAR CUENTA ================= */
  const rgForm = document.getElementById("rg-form");
  if (rgForm) {
    document.getElementById("rg-perks").innerHTML = [
      ["qr", "Boletos que no se clonan", "Código rotativo cada 15 segundos, guardado en tu dispositivo."],
      ["back", "Reembolso a un toque", "Hasta 48 h antes. Dinero de vuelta en 72 h."],
      ["swap", "Reventa al precio original", "Si no puedes ir, lo recuperas sin especular."],
      ["bell", "Aviso de preventas", "Te avisamos de tus artistas antes de que se agoten."],
    ].map(function (p) {
      return '<div class="row" style="gap:var(--s3);align-items:flex-start">' +
        '<span style="color:var(--accent);flex:none">' + UI.icon(p[0], 20) + "</span>" +
        '<div><strong class="t-sm">' + p[1] + '</strong><br><span class="t-xs txt-3">' + p[2] + "</span></div></div>";
    }).join("");

    const pw = document.getElementById("rg-pass");
    const bar = document.getElementById("rg-strength");
    const txt = document.getElementById("rg-strength-txt");
    pw.addEventListener("input", function () {
      const v = pw.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (v.length >= 12) score++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^\w\s]/.test(v)) score++;
      const pct = [0, 20, 40, 60, 80, 100][score];
      const label = ["Usa al menos 8 caracteres.", "Muy débil", "Débil", "Aceptable", "Buena", "Excelente"][score];
      const color = score <= 2 ? "var(--rojo)" : score === 3 ? "var(--ambar)" : "var(--jade)";
      bar.style.width = pct + "%";
      bar.style.background = color;
      txt.textContent = label;
    });

    rgForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("rg-name").value.trim();
      const mail = document.getElementById("rg-mail").value.trim();
      const p1 = pw.value, p2 = document.getElementById("rg-pass2").value;
      const birth = document.getElementById("rg-birth").value;

      if (name.split(/\s+/).length < 2) return UI.toast("Escribe tu nombre y al menos un apellido.", "err");
      if (!/^\S+@\S+\.\S+$/.test(mail)) return UI.toast("Ese correo no tiene un formato válido.", "err");
      if (p1.length < 8) return UI.toast("La contraseña necesita al menos 8 caracteres.", "err");
      if (p1 !== p2) return UI.toast("Las contraseñas no coinciden.", "err");
      if (!document.getElementById("rg-terms").checked) return UI.toast("Falta aceptar los términos y el aviso de privacidad.", "err");
      if (birth) {
        const age = (Date.now() - new Date(birth)) / (365.25 * 86400000);
        if (age < 13) return UI.toast("Necesitas al menos 13 años para tener cuenta propia.", "err");
      }

      const r = S.register({
        name: name, email: mail, password: p1,
        phone: document.getElementById("rg-phone").value.trim(),
        birth: birth,
        alerts: document.getElementById("rg-alerts").checked,
        newsletter: document.getElementById("rg-news").checked,
      });
      if (!r.ok) return UI.toast(r.error, "err");
      UI.toast("Cuenta creada. Bienvenido a Boletix.", "ok");
      setTimeout(() => go(r.user), 550);
    });
  }
})();
