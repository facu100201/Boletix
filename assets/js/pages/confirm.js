/* BOLETIX — Confirmación de compra */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["fan"]);
  if (!user) return;

  const root = document.getElementById("cf-root");
  const order = S.order(UI.param("orden"));
  if (!order) {
    root.innerHTML = '<div class="empty"><h2>No encontramos esa orden</h2>' +
      '<a class="btn btn-primary" href="cuenta.html">Ver mis compras</a></div>';
    return;
  }

  const ev = S.event(order.eventId);
  const zone = S.zone(ev, order.zoneId);
  const venue = S.venue(ev.venueId);

  root.innerHTML =
    '<div class="stack stack-5">' +

    '<div class="panel" style="border-color:var(--jade)">' +
    '<div class="panel-body stack stack-4 center-txt">' +
    '<div style="color:var(--jade);display:flex;justify-content:center">' + UI.icon("check", 48) + "</div>" +
    "<h1>Listo, son tuyos</h1>" +
    '<p class="txt-2" style="margin:0;max-width:48ch;margin-inline:auto">' +
    order.qty + (order.qty === 1 ? " boleto" : " boletos") + " para <strong>" + UI.esc(ev.title) +
    "</strong>. Ya están en tu cuenta y tu código empieza a rotar el día del evento.</p>" +
    '<div class="row center row-wrap" style="gap:var(--s2)">' +
    '<a class="btn btn-primary" href="cuenta.html">Ver mis boletos</a>' +
    '<button class="btn btn-ghost" id="cf-cal">' + UI.icon("calendar", 16) + "Agregar al calendario</button>" +
    "</div></div></div>" +

    // Talón
    '<div class="stub">' +
    '<div style="padding:var(--s4)">' +
    '<div class="row between" style="gap:var(--s3);align-items:flex-start">' +
    '<div class="stack stack-1 grow" style="min-width:0">' +
    '<span class="eyebrow">Orden ' + order.id + "</span>" +
    '<h2 style="font-size:var(--t-lg)">' + UI.esc(ev.title) + "</h2>" +
    '<span class="t-sm txt-2">' + UI.esc(ev.subtitle) + "</span>" +
    "</div>" +
    '<span class="badge badge-jade">Pagada</span>' +
    "</div></div>" +

    '<div class="stub-perf"></div>' +

    '<div style="padding:var(--s4)" class="stack stack-4">' +
    '<div class="grid g-2" style="gap:var(--s3)">' +
    kv("Fecha", UI.dateLong(ev.date)) +
    kv("Hora", UI.time(ev.date) + " h · puertas " + UI.time(new Date(new Date(ev.date) - ev.doorsMinutes * 60000))) +
    kv("Recinto", venue.name) +
    kv("Dirección", venue.address) +
    kv("Zona", zone.name) +
    kv("Asientos", order.seats ? order.seats.join(", ") : "General, sin numerar") +
    kv("Método de pago", order.method) +
    kv("Total pagado", UI.money2(order.total)) +
    "</div>" +

    '<div class="price-block">' +
    '<div class="price-line"><span>Boletos (' + order.qty + " × " + UI.money(order.unitPrice) + ")</span><strong>" + UI.money2(order.subtotal) + "</strong></div>" +
    '<div class="price-line"><span>Cargo por servicio (7%)</span><strong>' + UI.money2(order.fee) + "</strong></div>" +
    '<div class="price-line"><span>IVA sobre el cargo</span><strong>' + UI.money2(order.iva) + "</strong></div>" +
    '<div class="price-total"><span style="font-weight:700">Total</span><span class="amount">' + UI.money2(order.total) + "</span></div>" +
    "</div>" +

    '<div class="stack stack-2">' +
    '<span class="eyebrow">Tus boletos</span>' +
    order.tickets.map(function (t, i) {
      return '<a class="card card-flat row between" href="boleto.html?t=' + t.id + '" style="gap:var(--s3)">' +
        '<div class="row" style="gap:var(--s3)"><span style="color:var(--accent)">' + UI.icon("qr", 20) + "</span>" +
        '<div class="stack stack-1"><strong class="t-sm">Boleto ' + (i + 1) + " de " + order.qty + (t.seat ? " · " + t.seat : "") + "</strong>" +
        '<span class="mono t-xs txt-3">' + t.code + "</span></div></div>" +
        '<span class="txt-3">' + UI.icon("right", 16) + "</span></a>";
    }).join("") +
    "</div>" +

    '<div class="row row-wrap" style="gap:var(--s2)">' +
    '<button class="btn btn-ghost btn-sm" id="cf-receipt">' + UI.icon("doc", 16) + "Descargar comprobante</button>" +
    '<button class="btn btn-ghost btn-sm" id="cf-invoice">' + UI.icon("doc", 16) + "Solicitar factura</button>" +
    "</div>" +

    "</div></div>" +

    '<div class="note note-jade"><span>' + UI.icon("back", 18) + "</span><div class=\"t-sm\">" +
    "<strong>Si algo cambia, no pierdes tu dinero.</strong> Tienes reembolso completo con un toque hasta " +
    BX.CONFIG.refundHoursBefore + " horas antes (" +
    UI.dateShort(new Date(new Date(ev.date) - BX.CONFIG.refundHoursBefore * 3600000)) +
    "), o puedes revenderlo aquí mismo al precio que pagaste.</div></div>" +

    '<div class="stack stack-3">' +
    '<h3 style="font-size:var(--t-md)">Ya que estás por aquí</h3>' +
    '<div class="grid g-2 g-md-4">' +
    S.upcoming().filter((e) => e.id !== ev.id && e.category === ev.category).slice(0, 4).map(UI.eventCard).join("") +
    "</div></div>" +

    "</div>";

  function kv(k, v) {
    return '<div class="stack stack-1"><span class="eyebrow">' + k + "</span>" +
      '<span class="t-sm" style="font-weight:600">' + UI.esc(v) + "</span></div>";
  }

  /* ---------- Calendario (.ics) ---------- */
  document.getElementById("cf-cal").addEventListener("click", function () {
    function z(d) { return new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"; }
    const end = new Date(new Date(ev.date).getTime() + 3 * 3600000);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Boletix//ES",
      "BEGIN:VEVENT",
      "UID:" + order.id + "@boletix.mx",
      "DTSTAMP:" + z(Date.now()),
      "DTSTART:" + z(ev.date),
      "DTEND:" + z(end),
      "SUMMARY:" + ev.title,
      "LOCATION:" + venue.name + ", " + venue.address,
      "DESCRIPTION:Orden " + order.id + " — " + zone.name + (order.seats ? " — " + order.seats.join(", ") : ""),
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    download("boletix-" + order.id + ".ics", ics, "text/calendar");
    UI.toast("Archivo de calendario descargado", "ok");
  });

  /* ---------- Comprobante ---------- */
  document.getElementById("cf-receipt").addEventListener("click", function () {
    const txt = [
      "BOLETIX S.A. DE C.V.",
      "Comprobante de compra — prototipo sin validez fiscal",
      "",
      "Orden:            " + order.id,
      "Fecha de compra:  " + order.createdAt.replace("T", " "),
      "Titular:          " + user.name + " (" + user.email + ")",
      "",
      "Evento:           " + ev.title + " — " + ev.subtitle,
      "Fecha del evento: " + UI.dateLong(ev.date) + ", " + UI.time(ev.date) + " h",
      "Recinto:          " + venue.name + ", " + venue.address,
      "Zona:             " + zone.name,
      "Asientos:         " + (order.seats ? order.seats.join(", ") : "General"),
      "",
      "Boletos:          " + order.qty + " x " + UI.money2(order.unitPrice) + " = " + UI.money2(order.subtotal),
      "Cargo servicio:   " + UI.money2(order.fee) + " (7%)",
      "IVA sobre cargo:  " + UI.money2(order.iva),
      "Gastos gestión:   " + UI.money2(0),
      "Gastos envío:     " + UI.money2(0),
      "TOTAL PAGADO:     " + UI.money2(order.total),
      "",
      "Método de pago:   " + order.method,
      "",
      "Códigos de acceso:",
    ].concat(order.tickets.map((t, i) => "  " + (i + 1) + ". " + t.code + (t.seat ? "  " + t.seat : "")))
      .concat(["", "Reembolso disponible hasta " + BX.CONFIG.refundHoursBefore + " h antes del evento.",
        "Devolución en un máximo de " + BX.CONFIG.refundSlaHours + " horas, comisión incluida."])
      .join("\n");
    download("boletix-" + order.id + ".txt", txt, "text/plain");
    UI.toast("Comprobante descargado", "ok");
  });

  /* ---------- Factura ---------- */
  document.getElementById("cf-invoice").addEventListener("click", function () {
    UI.modal({
      title: "Solicitar factura",
      body:
        '<div class="stack stack-3">' +
        '<p class="t-sm txt-2" style="margin:0">Facturamos el cargo por servicio de ' + UI.money2(order.fee + order.iva) +
        ". El importe de los boletos lo factura el promotor, " + UI.esc(S.promoter(ev.promoterId).name) + ".</p>" +
        '<div class="field"><label class="label" for="rfc">RFC</label><input class="input mono" id="rfc" placeholder="XAXX010101000"></div>' +
        '<div class="field"><label class="label" for="rs">Razón social</label><input class="input" id="rs"></div>' +
        '<div class="field"><label class="label" for="uso">Uso de CFDI</label>' +
        '<select class="select" id="uso"><option>G03 — Gastos en general</option><option>D10 — Pagos por servicios educativos</option><option>S01 — Sin efectos fiscales</option></select></div>' +
        "</div>",
      actions: [
        { label: "Cancelar", variant: "btn-ghost" },
        {
          label: "Solicitar", variant: "btn-primary", onClick: function (body) {
            const rfc = body.querySelector("#rfc").value.trim();
            if (rfc.length < 12) { UI.toast("El RFC debe tener 12 o 13 caracteres.", "err"); return false; }
            UI.toast("Factura solicitada. Llega a tu correo en menos de 24 horas.", "ok");
          }
        },
      ],
    });
  });

  function download(name, content, type) {
    const blob = new Blob([content], { type: type + ";charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  UI.hydratePosters(root);
})();
