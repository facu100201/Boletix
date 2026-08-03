/* BOLETIX — Publica tu evento (B2B) */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  /* ---------- Cifras ---------- */
  document.getElementById("b2-stats").innerHTML = [
    ["48 h", "Dispersión", "tras cada evento"],
    ["$0", "Cuota de alta", "y sin exclusividad"],
    ["7%", "Comisión", "la paga el público"],
    ["12", "Recintos aliados", "en la CDMX"],
  ].map(function (s) {
    return '<div class="card card-flat" style="padding:var(--s3)">' +
      '<div class="stat-value" style="font-size:var(--t-xl)">' + s[0] + "</div>" +
      '<div class="t-sm" style="font-weight:600">' + s[1] + "</div>" +
      '<div class="t-xs txt-3">' + s[2] + "</div></div>";
  }).join("");

  /* ---------- Comparativa ---------- */
  document.getElementById("b2-compare").innerHTML = [
    ["Cargo por servicio al público", "15% a 20% + conceptos extra", "7% plano, desglosado", true],
    ["Cuota de alta del evento", "Variable, a veces por zona", "Sin costo", true],
    ["Exclusividad de venta", "Frecuentemente exigida", "No la pedimos", true],
    ["Dispersión de fondos", "Hasta 30 días post evento", "48 horas", true],
    ["Datos de tus compradores", "Propiedad de la plataforma", "Tuyos, exportables en CSV", true],
    ["Panel de analítica", "De pago o inexistente", "Incluido", true],
    ["Precios dinámicos", "Ofrecidos como función", "Prohibidos por contrato", false],
    ["Reembolso al comprador", "Caso por caso, hasta 21 días", "Autoservicio, 72 horas", true],
    ["Reventa del inventario", "Marketplace propio sin tope", "Topada al precio original", false],
    ["Costo por cancelar el evento", "Penalización contractual", "Sin penalización", true],
  ].map(function (r) {
    return "<tr><td><strong>" + r[0] + "</strong></td>" +
      '<td class="t-sm txt-3">' + r[1] + "</td>" +
      '<td class="t-sm" style="font-weight:600;color:' + (r[3] ? "var(--jade)" : "var(--accent)") + '">' + r[2] + "</td></tr>";
  }).join("");

  /* ---------- Proceso ----------
     Sí es una secuencia real, por eso va numerado. */
  document.getElementById("b2-steps").innerHTML = [
    ["Verificación", "Validamos tu RFC ante el SAT y el permiso de uso del recinto. Menos de un día hábil. Al pasar, tu evento lleva el sello de Promotor Verificado."],
    ["Configuración", "Cargas aforo, zonas y precios en el panel. El sistema te muestra en tiempo real el Precio Total Real que verá el público, con la comisión ya sumada."],
    ["Venta", "El inventario completo sale a la venta desde el minuto uno. Nada de liberar por tandas. La fila virtual dosifica el tráfico sin frenar la conversión."],
    ["Puerta", "Te enviamos las terminales de escaneo o usas la app en cualquier Android. Valida offline: la red del recinto no detiene la fila."],
    ["Corte", "Al terminar el evento tienes el corte completo: aforo real ingresado, no shows, ritmo de entrada por acceso y hora."],
    ["Liquidación", "A las 48 horas está el depósito en tu cuenta, con el desglose de comisión. Sin fondos de reserva ni retenciones sorpresa."],
  ].map(function (s, i) {
    return '<article class="card stack stack-3">' +
      '<span class="mono" style="font-size:var(--t-lg);color:var(--accent);font-weight:500">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<h3 style="font-size:var(--t-md)">' + s[0] + "</h3>" +
      '<p class="t-sm txt-2" style="margin:0">' + s[1] + "</p></article>";
  }).join("");

  /* ---------- Herramientas ---------- */
  document.getElementById("b2-tools").innerHTML = [
    ["chart", "Ventas en tiempo real", "Curva de venta por día y hora, ocupación por zona y ritmo de conversión. Sin esperar reportes semanales por correo."],
    ["users", "Tu público, exportable", "Quién compró, cuántos boletos, cuánto gastó y si volvió a otro evento tuyo. En CSV, cuando quieras, sin pedirlo."],
    ["scan", "App de puerta offline", "Corre en cualquier Android. Valida sin conexión y sincroniza después. Bitácora por acceso y por hora."],
    ["shield", "Protección anti-bot", "Límite por cuenta, detección de patrones automatizados y suspensión de cuentas acaparadoras antes de que se lleven tu inventario."],
    ["tag", "Precios que no te avergüenzan", "El público ve el precio final desde la búsqueda. Menos abandono en el checkout y menos quejas dirigidas a ti."],
    ["money", "Liquidación transparente", "Cada peso trazado: bruto, comisión, neto y fecha de depósito, evento por evento."],
  ].map(function (t) {
    return '<article class="card row" style="gap:var(--s3);align-items:flex-start">' +
      '<span style="color:var(--accent);flex:none">' + UI.icon(t[0], 24) + "</span>" +
      '<div class="stack stack-2"><h3 style="font-size:var(--t-md)">' + t[1] + "</h3>" +
      '<p class="t-sm txt-2" style="margin:0">' + t[2] + "</p></div></article>";
  }).join("");

  /* ---------- Formulario ---------- */
  document.getElementById("b2-venue").innerHTML =
    BX.VENUES.map((v) => '<option value="' + v.id + '">' + UI.esc(v.name) + "</option>").join("") +
    '<option value="otro">Otro recinto</option>';

  document.getElementById("b2-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const org = document.getElementById("b2-org").value.trim();
    const contact = document.getElementById("b2-contact").value.trim();
    const mail = document.getElementById("b2-mail").value.trim();
    const rfc = document.getElementById("b2-rfc").value.trim();

    if (org.length < 3) return UI.toast("Escribe el nombre de tu organización.", "err");
    if (contact.length < 3) return UI.toast("Falta la persona de contacto.", "err");
    if (!/^\S+@\S+\.\S+$/.test(mail)) return UI.toast("Ese correo no es válido.", "err");
    if (rfc && rfc.length < 12) return UI.toast("El RFC debe tener 12 o 13 caracteres.", "err");
    if (!document.getElementById("b2-rules").checked) {
      return UI.toast("Necesitas aceptar las dos reglas para dar de alta un evento.", "err");
    }

    UI.modal({
      title: "Solicitud recibida",
      body:
        '<div class="stack stack-3">' +
        '<p class="t-sm txt-2" style="margin:0">Folio <strong class="mono">PR-' +
        Math.floor(700 + Math.random() * 300) + "</strong>. Te llamamos en menos de un día hábil al correo " +
        UI.esc(mail) + " para agendar la verificación.</p>" +
        '<div class="card card-flat stack stack-2">' +
        '<span class="eyebrow">Mientras tanto</span>' +
        '<p class="t-sm" style="margin:0">Puedes recorrer el panel del promotor con la cuenta de demostración ' +
        '<code class="mono">promotor@boletix.mx</code> y la contraseña <code class="mono">boletix123</code>.</p></div>' +
        "</div>",
      actions: [
        { label: "Cerrar", variant: "btn-ghost" },
        {
          label: "Ver el panel", variant: "btn-primary", onClick: function () {
            const r = S.login("promotor@boletix.mx", "boletix123");
            if (r.ok) location.href = "promotor.html";
          }
        },
      ],
    });
    e.target.reset();
  });
})();
