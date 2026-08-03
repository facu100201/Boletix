/* BOLETIX — Boleto con QR dinámico */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["fan"]);
  if (!user) return;

  const root = document.getElementById("tk-root");
  const ticketId = UI.param("t");

  let order = null, ticket = null;
  S.orders(user.id).forEach(function (o) {
    o.tickets.forEach(function (t) { if (t.id === ticketId) { order = o; ticket = t; } });
  });

  if (!ticket) {
    root.innerHTML = '<div class="empty"><h2>No encontramos ese boleto</h2>' +
      '<a class="btn btn-primary" href="cuenta.html">Ver mis boletos</a></div>';
    return;
  }

  const ev = S.event(order.eventId);
  const zone = S.zone(ev, order.zoneId);
  const venue = S.venue(ev.venueId);
  const idx = order.tickets.indexOf(ticket) + 1;
  const dead = ticket.status === "cancelada" || ticket.status === "transferida";
  const used = ticket.status === "usada";

  document.title = ev.title + " — Mi boleto";

  root.innerHTML =
    '<div class="stack stack-4">' +
    '<a class="btn btn-plain btn-sm" href="cuenta.html" style="margin-left:-.7rem;align-self:flex-start">' +
    UI.icon("left", 16) + "Mis boletos</a>" +

    '<article class="stub" style="box-shadow:var(--shadow-lg)">' +

    // Cabecera del talón
    '<div style="padding:var(--s4);background:var(--surface-2)">' +
    '<div class="stack stack-2">' +
    '<div class="row between"><span class="eyebrow">Boletix · acceso ' + idx + " de " + order.qty + "</span>" +
    '<span class="badge ' + (used ? "badge-jade" : dead ? "badge-rojo" : "badge-jade") + '">' +
    (used ? "Ya ingresó" : dead ? (ticket.status === "transferida" ? "Transferido" : "Cancelado") : "Vigente") + "</span></div>" +
    '<h1 style="font-size:var(--t-xl);text-transform:uppercase;line-height:1">' + UI.esc(ev.title) + "</h1>" +
    '<span class="t-sm txt-2">' + UI.esc(ev.subtitle) + "</span>" +
    "</div></div>" +

    // QR
    '<div style="padding:var(--s5) var(--s4)" class="stack stack-4">' +
    '<div style="position:relative;max-width:300px;margin-inline:auto;width:100%">' +
    '<div class="qr-frame"><canvas id="qr-canvas" aria-label="Código de acceso dinámico"></canvas>' +
    (used ? '<div class="qr-used">Utilizado</div>' : dead ? '<div class="qr-used">Anulado</div>' : "") +
    "</div></div>" +

    (dead || used ? "" :
      '<div class="stack stack-2">' +
      '<div class="qr-timer"><i id="qr-bar" style="width:100%"></i></div>' +
      '<div class="row between t-xs txt-3">' +
      '<span>Se renueva en <strong class="mono" id="qr-secs">15</strong> s</span>' +
      '<span id="qr-net">' + UI.icon("wifi", 13) + " Válido sin conexión</span>" +
      "</div></div>") +

    '<div class="center-txt stack stack-1">' +
    '<span class="eyebrow">Código de respaldo</span>' +
    '<strong class="mono" style="font-size:var(--t-lg);letter-spacing:.1em">' + ticket.code + "</strong>" +
    '<span class="t-xs txt-3">Si el lector falla, el personal puede teclearlo.</span>' +
    "</div></div>" +

    '<div class="stub-perf"></div>' +

    // Datos
    '<div style="padding:var(--s4)" class="stack stack-4">' +
    '<div class="grid g-2" style="gap:var(--s3)">' +
    kv("Fecha", UI.dateLong(ev.date)) +
    kv("Hora", UI.time(ev.date) + " h") +
    kv("Puertas", UI.time(new Date(new Date(ev.date) - ev.doorsMinutes * 60000)) + " h") +
    kv("Recinto", venue.name) +
    kv("Zona", zone.name) +
    kv("Asiento", ticket.seat || "General, sin numerar") +
    kv("Titular", ticket.holder ? ticket.holder.name : user.name) +
    kv("Edad mínima", ev.minAge ? ev.minAge + " años con identificación" : "Todo público") +
    "</div>" +

    '<div class="note"><span>' + UI.icon("pin", 18) + "</span><div class=\"t-sm\">" +
    UI.esc(venue.address) + ", " + UI.esc(venue.alcaldia) + ". Metro " + UI.esc(venue.metro) + ".</div></div>" +
    "</div></article>" +

    // Cómo funciona
    '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Por qué tu código cambia solo</h2>' +
    '<span class="badge badge-violeta">Anti-clonación</span></div>' +
    '<div class="panel-body stack stack-3 t-sm txt-2">' +
    "<div>· El código se regenera cada " + BX.CONFIG.qrRotateSeconds + " segundos con una firma que sólo tu cuenta y el lector de la puerta conocen.</div>" +
    "<div>· Una captura de pantalla caduca antes de que alcances a mandarla por mensaje. Por eso no hay PDF que descargar.</div>" +
    "<div>· Funciona sin señal: la secuencia está guardada en este dispositivo y el lector la valida sin internet.</div>" +
    "<div>· Si transfieres el boleto, este código muere en ese instante y la otra persona recibe uno nuevo.</div>" +
    "</div></div>" +

    // Acciones
    (dead || used || ev.past ? "" :
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      '<button class="btn btn-ghost btn-sm" id="tk-bright">' + UI.icon("sun", 15) + "Modo puerta</button>" +
      '<a class="btn btn-ghost btn-sm" href="cuenta.html#boletos">' + UI.icon("share", 15) + "Transferir</a>" +
      '<a class="btn btn-ghost btn-sm" href="evento.html?id=' + ev.id + '">Ver el evento</a>' +
      "</div>") +

    "</div>";

  function kv(k, v) {
    return '<div class="stack stack-1"><span class="eyebrow">' + k + "</span>" +
      '<span class="t-sm" style="font-weight:600">' + UI.esc(v) + "</span></div>";
  }

  /* ---------- Rotación del código ---------- */
  const canvas = document.getElementById("qr-canvas");
  function paint() {
    UI.paintQR(canvas, UI.rotatingToken(ticket.code));
  }
  paint();

  if (!dead && !used) {
    let last = UI.rotatingToken(ticket.code);
    setInterval(function () {
      const now = UI.rotatingToken(ticket.code);
      const secs = UI.tokenSecondsLeft();
      const bar = document.getElementById("qr-bar");
      const out = document.getElementById("qr-secs");
      if (bar) bar.style.width = (secs / BX.CONFIG.qrRotateSeconds) * 100 + "%";
      if (out) out.textContent = secs;
      if (now !== last) { last = now; paint(); }
    }, 500);
  }

  /* ---------- Modo puerta: brillo máximo y pantalla despierta ---------- */
  const bright = document.getElementById("tk-bright");
  if (bright) {
    let on = false;
    let wakeLock = null;
    bright.addEventListener("click", async function () {
      on = !on;
      document.body.style.filter = on ? "brightness(1.35)" : "";
      bright.classList.toggle("btn-primary", on);
      bright.classList.toggle("btn-ghost", !on);
      bright.innerHTML = UI.icon("sun", 15) + (on ? "Modo puerta activo" : "Modo puerta");
      if (on && "wakeLock" in navigator) {
        try { wakeLock = await navigator.wakeLock.request("screen"); } catch (e) { /* sin soporte */ }
      } else if (wakeLock) {
        wakeLock.release(); wakeLock = null;
      }
      UI.toast(on ? "Brillo al máximo y pantalla despierta para el lector." : "Modo puerta desactivado.");
    });
  }

  window.addEventListener("resize", paint);
})();
