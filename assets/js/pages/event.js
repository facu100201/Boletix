/* BOLETIX — Detalle de evento */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const ev = S.event(UI.param("id")) || S.upcoming()[0];
  const root = document.getElementById("ev-root");

  if (!ev) {
    root.innerHTML = '<div class="wrap section"><div class="empty"><h2>Ese evento no existe</h2>' +
      '<a class="btn btn-primary" href="eventos.html">Ver la cartelera</a></div></div>';
    return;
  }

  document.title = ev.title + " — Boletix";
  const venue = S.venue(ev.venueId);
  const promoter = S.promoter(ev.promoterId);
  const cat = BX.CATEGORIES.find((c) => c.id === ev.category);
  const soldPct = Math.round((ev.sold / ev.capacity) * 100);
  let selectedZone = ev.zones.filter((z) => z.capacity - z.sold > 0)[0] || ev.zones[0];
  let qty = 2;

  /* ---------- Encabezado ---------- */
  function headerHTML() {
    const doors = new Date(new Date(ev.date) - ev.doorsMinutes * 60000);
    return (
      '<section style="position:relative;overflow:hidden">' +
      '<div class="wrap" style="padding-block:var(--s4) var(--s5)">' +
      '<a class="btn btn-plain btn-sm" href="eventos.html" style="margin-left:-.7rem;margin-bottom:var(--s3)">' +
      UI.icon("left", 16) + "Cartelera</a>" +
      '<div class="grid" style="gap:var(--s5);grid-template-columns:1fr" id="ev-hero-grid">' +

      '<div style="max-width:340px;width:100%">' + UI.posterHTML(ev, {}) + "</div>" +

      '<div class="stack stack-4">' +
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      '<span class="badge badge-rosa">' + UI.esc(cat ? cat.name : ev.category) + "</span>" +
      (ev.trending ? '<span class="badge badge-ambar">En tendencia</span>' : "") +
      (ev.lowStock ? '<span class="badge badge-rojo">Últimos lugares</span>' : "") +
      (ev.minAge ? '<span class="badge">' + ev.minAge + "+</span>" : '<span class="badge">Todo público</span>') +
      "</div>" +

      "<div>" +
      '<h1 style="font-size:clamp(2rem,7vw,3.2rem);text-transform:uppercase;line-height:.95">' + UI.esc(ev.title) + "</h1>" +
      '<p class="txt-2" style="font-size:var(--t-md);margin-top:var(--s2)">' + UI.esc(ev.subtitle) + "</p>" +
      "</div>" +

      '<div class="stack stack-2">' +
      '<div class="row"><span class="txt-3">' + UI.icon("calendar", 18) + "</span>" +
      "<span><strong>" + UI.dateLong(ev.date) + "</strong> · " + UI.time(ev.date) + " h" +
      '<span class="txt-3 t-sm"> (puertas ' + UI.time(doors) + ")</span></span></div>" +
      '<div class="row"><span class="txt-3">' + UI.icon("pin", 18) + "</span>" +
      "<span><strong>" + UI.esc(venue.name) + "</strong> · " + UI.esc(venue.address) + "</span></div>" +
      '<div class="row"><span class="txt-3">' + UI.icon("clock", 18) + "</span>" +
      "<span>" + UI.relative(ev.date) + " · Metro " + UI.esc(venue.metro) + "</span></div>" +
      "</div>" +

      '<div class="card card-flat stack stack-2">' +
      '<div class="row between t-sm"><span class="txt-2">Aforo vendido</span>' +
      '<strong class="mono">' + soldPct + "% · " + UI.numf(ev.capacity - ev.sold) + " lugares libres</strong></div>" +
      '<div class="bar-track"><i style="width:' + soldPct + '%"></i></div>' +
      '<p class="t-xs txt-3" style="margin:0">Cifra real de inventario. No liberamos boletos por tandas para inflar la urgencia.</p>' +
      "</div>" +

      '<div class="row row-wrap" style="gap:var(--s2)">' +
      '<button class="btn btn-ghost btn-sm" id="ev-watch"></button>' +
      '<button class="btn btn-ghost btn-sm" id="ev-share">' + UI.icon("share", 16) + "Compartir</button>" +
      "</div>" +

      "</div></div></div></section>"
    );
  }

  /* ---------- Selector de zonas ---------- */
  function zonesHTML() {
    return (
      '<section class="section" style="padding-top:0"><div class="wrap">' +
      '<div class="grid" style="grid-template-columns:1fr;gap:var(--s5)" id="ev-buy-grid">' +

      '<div class="stack stack-4">' +
      '<div class="stack stack-1"><span class="eyebrow">Paso 1 de 4</span><h2 style="font-size:var(--t-xl)">Elige tu zona</h2></div>' +
      '<p class="t-sm txt-2" style="margin:0">Cada precio ya incluye el cargo por servicio de 7% y el IVA correspondiente. Toca una zona para ver el desglose.</p>' +
      '<div class="stack stack-2" id="ev-zones"></div>' +
      '<div class="note note-jade"><span>' + UI.icon("lock", 18) + "</span><div>" +
      "<strong>Precio fijo garantizado.</strong> Este evento no usa precios dinámicos. " +
      "El precio de hoy es el precio del último boleto que se venda.</div></div>" +
      "</div>" +

      '<aside class="stack stack-4" id="ev-summary"></aside>' +
      "</div></div></section>"
    );
  }

  /* ---------- Detalle textual ---------- */
  function bodyHTML() {
    const acc = ev.zones.some((z) => z.accessible);
    return (
      '<section class="section" style="padding-top:0"><div class="wrap">' +
      '<div class="grid g-md-2" style="gap:var(--s6);align-items:start">' +

      '<div class="stack stack-5">' +
      '<div class="stack stack-3"><h2 style="font-size:var(--t-lg)">Sobre el evento</h2>' +
      '<p class="txt-2">' + UI.esc(ev.about) + "</p></div>" +

      '<div class="stack stack-3"><h3 style="font-size:var(--t-md)">Cartel</h3>' +
      '<ul class="stack stack-2" style="list-style:none;padding:0;margin:0">' +
      ev.lineup.map(function (l, i) {
        return '<li class="row" style="gap:var(--s3)">' +
          '<span class="mono t-xs txt-3" style="width:1.6rem">' + String(i + 1).padStart(2, "0") + "</span>" +
          "<span" + (i === 0 ? ' style="font-weight:600"' : ' class="txt-2"') + ">" + UI.esc(l) + "</span></li>";
      }).join("") + "</ul></div>" +

      '<div class="stack stack-3"><h3 style="font-size:var(--t-md)">Etiquetas</h3>' +
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      ev.tags.map((t) => '<a class="chip" href="eventos.html?q=' + encodeURIComponent(t) + '">#' + UI.esc(t) + "</a>").join("") +
      "</div></div>" +

      '<div class="stack stack-3"><h3 style="font-size:var(--t-md)">Antes de comprar</h3>' +
      '<div class="stack stack-2 t-sm txt-2">' +
      "<div>· Edad mínima: " + (ev.minAge ? ev.minAge + " años con identificación oficial" : "todo público") + ".</div>" +
      "<div>· Máximo " + BX.CONFIG.maxTicketsPerAccount + " boletos por cuenta. Es un tope contra bots, no una estrategia de escasez.</div>" +
      "<div>· Reembolso completo a un toque hasta " + BX.CONFIG.refundHoursBefore + " horas antes. Dinero de vuelta en " + BX.CONFIG.refundSlaHours + " horas.</div>" +
      "<div>· Puedes transferir o revender tu boleto dentro de Boletix al precio original, nunca arriba.</div>" +
      (acc ? "<div>· Zona accesible para silla de ruedas disponible, con acompañante sin costo adicional.</div>" : "") +
      "</div></div>" +
      "</div>" +

      '<div class="stack stack-4">' +
      // Recinto
      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">' + UI.esc(venue.name) + "</h3>" +
      '<span class="badge">' + UI.numf(venue.capacity) + " lugares</span></div>" +
      '<div class="panel-body stack stack-3">' +
      '<div id="ev-minimap"></div>' +
      '<div class="stack stack-1 t-sm">' +
      '<div class="row" style="gap:var(--s2)"><span class="txt-3">' + UI.icon("pin", 16) + "</span><span>" + UI.esc(venue.address) + ", " + UI.esc(venue.alcaldia) + "</span></div>" +
      '<div class="row" style="gap:var(--s2)"><span class="txt-3">' + UI.icon("right", 16) + "</span><span>Metro " + UI.esc(venue.metro) + "</span></div>" +
      "</div>" +
      '<a class="btn btn-ghost btn-sm btn-block" href="eventos.html?q=' + encodeURIComponent(venue.name) + '">Más eventos aquí</a>' +
      "</div></div>" +

      // Promotor
      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Organiza</h3>' +
      (promoter.verified ? '<span class="badge badge-jade">' + UI.icon("check", 13) + " Verificado</span>" : '<span class="badge badge-rojo">Sin verificar</span>') +
      "</div><div class=\"panel-body stack stack-3\">" +
      '<div class="row" style="gap:var(--s3)"><span class="avatar avatar-lg">' + UI.esc(promoter.name.slice(0, 2).toUpperCase()) + "</span>" +
      '<div class="stack stack-1"><strong>' + UI.esc(promoter.name) + "</strong>" +
      '<span class="t-sm txt-2">En Boletix desde ' + new Date(promoter.since).getFullYear() + " · " + promoter.rating + " ★</span></div></div>" +
      '<p class="t-xs txt-3" style="margin:0">RFC validado ante el SAT y permiso de uso del recinto en expediente. ' +
      "Sin este sello, un evento no se publica ni puede cobrar en Boletix.</p>" +
      "</div></div>" +

      // Garantías
      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Tu compra está protegida</h3></div>' +
      '<div class="panel-body stack stack-3 t-sm">' +
      [["qr", "QR dinámico", "Tu código se regenera cada 15 segundos. Una captura de pantalla caduca antes de poder compartirse."],
       ["back", "Reembolso a un toque", "Sin llamadas ni formularios. Botón en tu cuenta hasta 48 h antes."],
       ["swap", "Reventa al precio original", "Si no puedes ir, lo publicas aquí con tope duro. Nadie especula con tu boleto."],
       ["wifi", "Funciona sin señal", "El boleto se guarda en tu dispositivo y valida offline en la puerta."]].map(function (g) {
        return '<div class="row" style="gap:var(--s3);align-items:flex-start"><span style="color:var(--jade);flex:none">' +
          UI.icon(g[0], 18) + "</span><div><strong>" + g[1] + "</strong><br><span class=\"txt-3 t-xs\">" + g[2] + "</span></div></div>";
      }).join("") +
      "</div></div>" +

      "</div></div></div></section>"
    );
  }

  /* ---------- Similares ---------- */
  function similarHTML() {
    const sim = S.upcoming().filter((e) => e.id !== ev.id &&
      (e.category === ev.category || e.venueId === ev.venueId)).slice(0, 4);
    if (!sim.length) return "";
    return (
      '<section class="section" style="padding-top:0"><div class="wrap">' +
      '<div class="section-head"><div class="stack stack-1"><span class="eyebrow">También te puede interesar</span>' +
      '<h2 style="font-size:var(--t-xl)">Parecidos a este</h2></div></div>' +
      '<div class="grid g-2 g-md-4">' + sim.map(UI.eventCard).join("") + "</div>" +
      "</div></section>"
    );
  }

  root.innerHTML = headerHTML() + zonesHTML() + bodyHTML() + similarHTML();

  /* Rejillas de dos columnas en escritorio */
  const mq = window.matchMedia("(min-width: 900px)");
  function applyGrid() {
    const hero = document.getElementById("ev-hero-grid");
    const buy = document.getElementById("ev-buy-grid");
    if (hero) hero.style.gridTemplateColumns = mq.matches ? "340px minmax(0,1fr)" : "1fr";
    if (buy) buy.style.gridTemplateColumns = mq.matches ? "minmax(0,1fr) 360px" : "1fr";
  }
  applyGrid();
  mq.addEventListener("change", applyGrid);

  /* ---------- Zonas ---------- */
  function renderZones() {
    document.getElementById("ev-zones").innerHTML = ev.zones.map(function (z) {
      const left = z.capacity - z.sold;
      const total = BX.ptr(z.price);
      const on = z.id === selectedZone.id;
      const soldOut = left <= 0;
      return (
        '<button class="card' + (on ? "" : " card-flat") + '" data-zone="' + z.id + '"' +
        (soldOut ? " disabled" : "") +
        ' style="text-align:left;cursor:' + (soldOut ? "not-allowed" : "pointer") +
        ";border-color:" + (on ? "var(--accent)" : "var(--line)") +
        ";opacity:" + (soldOut ? ".5" : "1") + ';width:100%">' +
        '<div class="row between" style="gap:var(--s3)">' +
        '<div class="row grow" style="gap:var(--s3);min-width:0">' +
        '<span class="zone-dot" style="background:' + z.color + ';width:14px;height:36px;border-radius:4px"></span>' +
        '<div class="stack stack-1 grow" style="min-width:0">' +
        '<span style="font-weight:600">' + UI.esc(z.name) + (z.accessible ? ' <span class="badge badge-jade">Accesible</span>' : "") + "</span>" +
        '<span class="t-xs txt-3">' + (soldOut ? "Agotado" : left < 40 ? "Sólo " + left + " lugares" : UI.numf(left) + " disponibles") +
        (z.seated ? " · Numerado" : " · General") + "</span>" +
        "</div></div>" +
        '<div class="right" style="flex:none">' +
        '<div class="mono" style="font-weight:500;font-size:var(--t-md)">' + UI.money(total) + "</div>" +
        '<div class="t-xs txt-3">total por boleto</div>' +
        "</div></div></button>"
      );
    }).join("");
  }

  document.getElementById("ev-zones").addEventListener("click", function (e) {
    const b = e.target.closest("[data-zone]");
    if (!b || b.disabled) return;
    selectedZone = S.zone(ev, b.dataset.zone);
    renderZones(); renderSummary(); renderActionBar();
  });

  /* ---------- Resumen lateral ---------- */
  function renderSummary() {
    const u = S.session();
    const allowance = u ? S.remainingAllowance(u.id, ev.id) : BX.CONFIG.maxTicketsPerAccount;
    const left = selectedZone.capacity - selectedZone.sold;
    const maxQty = Math.max(1, Math.min(allowance, left, BX.CONFIG.maxTicketsPerAccount));
    if (qty > maxQty) qty = maxQty;
    const b = BX.breakdown(selectedZone.price, qty);

    document.getElementById("ev-summary").innerHTML =
      '<div class="panel" style="position:sticky;top:calc(var(--nav-h) + var(--s4))">' +
      '<div class="panel-head"><h3 style="font-size:var(--t-base)">Tu selección</h3>' +
      '<span class="badge" style="background:' + selectedZone.color + '22;color:' + selectedZone.color + '">' + UI.esc(selectedZone.name) + "</span></div>" +
      '<div class="panel-body stack stack-4">' +

      '<div class="field"><label class="label" for="ev-qty">Cantidad</label>' +
      '<div class="row" style="gap:var(--s2)">' +
      '<button class="btn btn-icon btn-ghost" id="qty-minus" aria-label="Quitar un boleto">−</button>' +
      '<input class="input mono center-txt" id="ev-qty" value="' + qty + '" readonly style="text-align:center;flex:1">' +
      '<button class="btn btn-icon btn-ghost" id="qty-plus" aria-label="Agregar un boleto">+</button>' +
      "</div>" +
      '<span class="hint">Máximo ' + BX.CONFIG.maxTicketsPerAccount + " por cuenta" +
      (u && allowance < BX.CONFIG.maxTicketsPerAccount ? " · ya tienes " + (BX.CONFIG.maxTicketsPerAccount - allowance) + " de este evento" : "") +
      "</span></div>" +

      '<div class="price-block">' +
      '<div class="price-line"><span>' + qty + " × " + UI.esc(selectedZone.name) + "</span><strong>" + UI.money2(b.subtotal) + "</strong></div>" +
      '<div class="price-line"><span>Cargo por servicio (7%)</span><strong>' + UI.money2(b.fee) + "</strong></div>" +
      '<div class="price-line"><span>IVA sobre el cargo</span><strong>' + UI.money2(b.iva) + "</strong></div>" +
      '<div class="price-total"><span style="font-weight:700">Total a pagar</span><span class="amount">' + UI.money2(b.total) + "</span></div>" +
      "</div>" +

      '<div class="savings">' + UI.icon("check", 16) + "Ahorras " + UI.money(b.savings) + " contra un cargo del " +
      Math.round(BX.CONFIG.competitorFeeRate * 100) + "%</div>" +

      '<button class="btn btn-primary btn-lg btn-block" id="ev-buy">Continuar a la fila</button>' +
      '<p class="t-xs txt-3 center-txt" style="margin:0">Entrar a la fila congela este precio. No sube mientras esperas.</p>' +
      "</div></div>";

    document.getElementById("qty-minus").addEventListener("click", function () {
      if (qty > 1) { qty--; renderSummary(); renderActionBar(); }
    });
    document.getElementById("qty-plus").addEventListener("click", function () {
      if (qty < maxQty) { qty++; renderSummary(); renderActionBar(); }
      else if (allowance <= qty) UI.toast("Tope de " + BX.CONFIG.maxTicketsPerAccount + " boletos por cuenta en este evento.", "err");
      else UI.toast("No quedan más lugares en esta zona.", "err");
    });
    document.getElementById("ev-buy").addEventListener("click", goBuy);
  }

  /* ---------- Barra de acción móvil ---------- */
  function renderActionBar() {
    const b = BX.breakdown(selectedZone.price, qty);
    document.getElementById("ev-actionbar").innerHTML =
      '<div class="actionbar">' +
      '<div class="stack stack-1 grow" style="min-width:0">' +
      '<span class="t-xs txt-3">' + qty + " × " + UI.esc(selectedZone.name) + "</span>" +
      '<span class="mono" style="font-weight:500;font-size:var(--t-md)">' + UI.money(b.total) + "</span>" +
      "</div>" +
      '<button class="btn btn-primary" id="ev-buy-mobile" style="flex:none">Continuar</button>' +
      "</div>";
    document.getElementById("ev-buy-mobile").addEventListener("click", goBuy);
  }

  /* ---------- Ir a comprar ---------- */
  function goBuy() {
    const u = S.session();
    if (!u) {
      location.href = "login.html?next=" + encodeURIComponent("evento.html?id=" + ev.id);
      return;
    }
    if (u.role !== "fan") {
      UI.toast("Las cuentas de " + u.role + " no compran boletos. Entra con una cuenta de comprador.", "err");
      return;
    }
    const params = "id=" + ev.id + "&zona=" + selectedZone.id + "&qty=" + qty;
    location.href = "fila.html?" + params;
  }

  /* ---------- Alerta y compartir ---------- */
  function renderWatch() {
    const on = S.isWatching(ev.id);
    const btn = document.getElementById("ev-watch");
    btn.innerHTML = UI.icon("bell", 16) + (on ? "Avisos activados" : "Avisarme de cambios");
    btn.classList.toggle("btn-primary", on);
    btn.classList.toggle("btn-ghost", !on);
  }
  document.getElementById("ev-watch").addEventListener("click", function () {
    const on = S.watch(ev.id);
    renderWatch();
    UI.toast(on ? "Te avisamos si se liberan lugares o cambia el evento." : "Avisos desactivados.", on ? "ok" : null);
  });
  document.getElementById("ev-share").addEventListener("click", function () {
    const url = location.href;
    if (navigator.share) navigator.share({ title: ev.title, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => UI.toast("Liga copiada", "ok"));
    else UI.toast(url);
  });

  /* ---------- Mini plano del recinto ---------- */
  function renderMiniMap() {
    const host = document.getElementById("ev-minimap");
    const parts = ev.zones.map(function (z, i) {
      const y = 18 + i * 17;
      return '<rect x="10" y="' + y + '" width="180" height="13" rx="3" fill="' + z.color + '" opacity="' + (0.35 + 0.16 * (ev.zones.length - i)) + '"/>' +
        '<text x="100" y="' + (y + 9.5) + '" font-size="7.5" fill="#fff" text-anchor="middle" font-family="DM Mono, monospace">' + UI.esc(z.name).slice(0, 22) + "</text>";
    }).join("");
    host.innerHTML =
      '<svg viewBox="0 0 200 ' + (26 + ev.zones.length * 17) + '" class="seatmap" style="padding:6px" role="img" aria-label="Distribución de zonas del recinto">' +
      '<rect x="45" y="4" width="110" height="10" rx="2" fill="var(--txt-3)" opacity=".5"/>' +
      '<text x="100" y="11.5" font-size="6.5" fill="var(--bg)" text-anchor="middle" font-family="DM Mono, monospace">ESCENARIO</text>' +
      parts + "</svg>";
  }

  renderZones();
  renderSummary();
  renderActionBar();
  renderWatch();
  renderMiniMap();
  UI.hydratePosters();
})();
