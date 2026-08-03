/* BOLETIX — App de validación en puerta */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["staff", "admin"]);
  if (!user) return;

  const root = document.getElementById("sc-root");
  let gate = "Puerta A";
  let eventId = "";
  let online = navigator.onLine;

  /* Eventos de hoy o próximos, para elegir el que se está validando */
  const evs = S.events().slice().sort((a, b) =>
    Math.abs(new Date(a.date) - Date.now()) - Math.abs(new Date(b.date) - Date.now()));
  eventId = evs[0].id;

  function render() {
    const ev = S.event(eventId);
    const venue = S.venue(ev.venueId);
    const scans = S.scans();
    const ok = scans.filter((s) => s.status === "valido").length;
    const bad = scans.length - ok;

    root.innerHTML =
      '<div class="stack stack-5">' +

      '<div class="row between row-wrap" style="gap:var(--s3)">' +
      '<div class="stack stack-1">' +
      '<span class="eyebrow">Control de acceso</span>' +
      '<h1 style="font-size:var(--t-xl)">App de puerta</h1>' +
      '<span class="t-sm txt-2">' + UI.esc(user.name) + "</span>" +
      "</div>" +
      '<span class="badge ' + (online ? "badge-jade" : "badge-ambar") + '" id="sc-net">' +
      UI.icon("wifi", 13) + (online ? " En línea" : " Sin conexión · validando local") + "</span>" +
      "</div>" +

      '<div class="grid g-md-2" style="gap:var(--s3)">' +
      '<div class="field"><label class="label" for="sc-ev">Evento en puerta</label>' +
      '<select class="select" id="sc-ev">' +
      evs.map((e) => '<option value="' + e.id + '"' + (e.id === eventId ? " selected" : "") + ">" +
        UI.esc(e.title) + " — " + UI.dateShort(e.date) + "</option>").join("") +
      "</select></div>" +
      '<div class="field"><label class="label" for="sc-gate">Acceso</label>' +
      '<select class="select" id="sc-gate">' +
      ["Puerta A", "Puerta B", "Acceso VIP", "Acceso accesible"].map((g) =>
        '<option' + (g === gate ? " selected" : "") + ">" + g + "</option>").join("") +
      "</select></div></div>" +

      '<div class="card card-flat stack stack-2">' +
      '<div class="row between t-sm"><span class="txt-2">' + UI.esc(ev.title) + " · " + UI.esc(venue.name) + "</span>" +
      '<strong class="mono">' + UI.numf(ev.sold) + " boletos emitidos</strong></div>" +
      "</div>" +

      // Lector
      '<div class="panel" style="border-color:var(--accent)">' +
      '<div class="panel-head"><h2 style="font-size:var(--t-base)">Validar boleto</h2>' +
      '<span class="badge badge-violeta">QR dinámico</span></div>' +
      '<div class="panel-body stack stack-4">' +
      '<div id="sc-viewport" style="position:relative;background:var(--ink-900);border-radius:var(--r-md);aspect-ratio:16/10;display:grid;place-items:center;overflow:hidden">' +
      '<div style="color:rgba(255,255,255,.35);display:flex;flex-direction:column;align-items:center;gap:var(--s2)">' +
      UI.icon("scan", 46) +
      '<span class="t-sm">Apunta la cámara al código del asistente</span></div>' +
      '<div style="position:absolute;inset:18% 22%;border:2px solid var(--accent);border-radius:12px;opacity:.55"></div>' +
      "</div>" +

      '<form class="stack stack-3" id="sc-form">' +
      '<div class="field"><label class="label" for="sc-code">Código del boleto</label>' +
      '<input class="input mono" id="sc-code" placeholder="BTX-0000-0001" autocomplete="off" ' +
      'style="text-transform:uppercase;letter-spacing:.08em;font-size:var(--t-md)"></div>' +
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      '<button class="btn btn-primary grow" type="submit">Validar acceso</button>' +
      '<button class="btn btn-ghost" type="button" id="sc-demo">Usar un código real de la demo</button>' +
      "</div></form>" +

      '<div id="sc-result"></div>' +
      "</div></div>" +

      // Contadores
      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      tile("Accesos hoy", UI.numf(ok), "validados en esta sesión") +
      tile("Rechazos", UI.numf(bad), "duplicados o inválidos") +
      tile("Aforo restante", UI.numf(Math.max(0, ev.sold - ok)), "boletos sin ingresar") +
      tile("Ritmo", (ok ? Math.round(ok / Math.max(1, scans.length) * 100) : 0) + "%", "tasa de aceptación") +
      "</div>" +

      // Bitácora
      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Bitácora de la puerta</h2>' +
      '<button class="btn btn-plain btn-sm" id="sc-clear">Limpiar vista</button></div>' +
      '<div class="panel-body">' +
      (scans.length
        ? '<div class="stack stack-2">' + scans.slice(0, 14).map(function (s) {
            const color = { valido: "var(--jade)", duplicado: "var(--rojo)", invalido: "var(--rojo)", cancelado: "var(--ambar)" }[s.status];
            return '<div class="row between t-sm" style="padding-block:6px;border-bottom:1px solid var(--line)">' +
              '<div class="row" style="gap:var(--s2);min-width:0">' +
              '<i class="dot" style="background:' + color + '"></i>' +
              '<span class="mono t-xs">' + UI.esc(s.code) + "</span>" +
              '<span class="txt-2">' + UI.esc(s.label) + "</span></div>" +
              '<span class="t-xs txt-3">' + new Date(s.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
              " · " + UI.esc(s.gate) + "</span></div>";
          }).join("") + "</div>"
        : '<p class="txt-3 t-sm" style="margin:0">Sin lecturas todavía.</p>') +
      "</div></div>" +

      '<div class="note"><span>' + UI.icon("wifi", 18) + "</span><div class=\"t-sm\">" +
      "<strong>Funciona sin internet.</strong> La lista de códigos válidos se descarga antes de abrir puertas y la validación " +
      "ocurre en el dispositivo. Las lecturas se sincronizan solas cuando vuelve la señal, así que una caída de la red " +
      "del recinto no detiene la fila.</div></div>" +

      "</div>";

    BX.app.fillIconSlots(root);
    bind();
  }

  function tile(label, value, sub) {
    return '<div class="card card-flat" style="padding:var(--s3)">' +
      '<div class="stat-value" style="font-size:var(--t-xl)">' + value + "</div>" +
      '<div class="t-sm" style="font-weight:600">' + label + "</div>" +
      '<div class="t-xs txt-3">' + sub + "</div></div>";
  }

  function showResult(res) {
    const host = document.getElementById("sc-result");
    const map = {
      valido: ["jade", "check", "Acceso autorizado"],
      duplicado: ["rojo", "alert", "Boleto ya utilizado"],
      invalido: ["rojo", "x", "Código inválido"],
      cancelado: ["ambar", "alert", "Boleto anulado"],
    };
    const m = map[res.status];
    host.innerHTML =
      '<div class="card" style="border-color:var(--' + m[0] + ');background:var(--' + m[0] + '-soft)">' +
      '<div class="row" style="gap:var(--s3);align-items:flex-start">' +
      '<span style="color:var(--' + m[0] + ');flex:none">' + UI.icon(m[1], 30) + "</span>" +
      '<div class="stack stack-1 grow">' +
      '<strong style="font-size:var(--t-md)">' + m[2] + "</strong>" +
      '<span class="t-sm txt-2">' + UI.esc(res.detail) + "</span>" +
      (res.order ? '<span class="t-xs mono txt-3">Orden ' + res.order.id + "</span>" : "") +
      "</div></div></div>";

    if (navigator.vibrate) navigator.vibrate(res.status === "valido" ? 40 : [60, 50, 60]);
    setTimeout(function () {
      if (host.firstChild) host.innerHTML = "";
    }, 6000);
  }

  function bind() {
    document.getElementById("sc-ev").addEventListener("change", function (e) {
      eventId = e.target.value; render();
    });
    document.getElementById("sc-gate").addEventListener("change", function (e) {
      gate = e.target.value;
    });

    const form = document.getElementById("sc-form");
    const input = document.getElementById("sc-code");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const code = input.value.trim();
      if (!code) { UI.toast("Escribe o escanea un código.", "err"); return; }
      const res = S.scan(code, gate);
      render();
      showResult(res);
      const inp = document.getElementById("sc-code");
      inp.value = "";
      inp.focus();
    });

    document.getElementById("sc-demo").addEventListener("click", function () {
      // Toma un boleto vigente real del almacén, para poder probar el flujo completo.
      let found = null;
      S.orders().some(function (o) {
        return o.tickets.some(function (t) {
          if (t.status === "valida") { found = t; return true; }
          return false;
        });
      });
      if (!found) { UI.toast("No quedan boletos vigentes en la demo. Compra uno o reinicia los datos.", "err"); return; }
      document.getElementById("sc-code").value = found.code;
      UI.toast("Código cargado. Presiona Validar acceso.", "ok");
    });

    document.getElementById("sc-clear").addEventListener("click", function () {
      S.all().scans.length = 0;
      S.save();
      render();
    });

    setTimeout(function () {
      const i = document.getElementById("sc-code");
      if (i) i.focus();
    }, 120);
  }

  window.addEventListener("online", function () { online = true; render(); UI.toast("Conexión restablecida. Sincronizando lecturas.", "ok"); });
  window.addEventListener("offline", function () { online = false; render(); UI.toast("Sin conexión. La validación sigue funcionando local.", null); });

  render();
})();
