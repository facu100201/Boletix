/* BOLETIX — Portada */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  // La portada vive en la raíz, así que sus ligas bajan a paginas/.
  const P = (file) => UI.url("paginas/" + file);

  /* ---------- Buscador ---------- */
  const form = document.getElementById("hero-search");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const q = document.getElementById("q").value.trim();
    location.href = P("eventos.html") + (q ? "?q=" + encodeURIComponent(q) : "");
  });

  /* ---------- Categorías ---------- */
  document.getElementById("hero-cats").innerHTML = BX.CATEGORIES.map(function (c) {
    return '<a class="chip" href="' + P("eventos.html?cat=" + c.id) + '">' + UI.icon(c.icon, 15) + c.name + "</a>";
  }).join("");

  /* ---------- Cifras del hero ---------- */
  const st = S.platformStats();
  const upcoming = S.upcoming();

  /* ---------- Lista "en tendencia" del hero ---------- */
  const swatches = ["var(--rosa)", "var(--ambar)", "var(--jade)", "var(--violeta)"];
  document.getElementById("hero-list").innerHTML = upcoming.slice(0, 4).map(function (e, i) {
    const venue = S.venue(e.venueId);
    return (
      '<li>' +
      '<span class="hln-n">0' + (i + 1) + '</span>' +
      '<span class="hln-sw" style="background:' + swatches[i % swatches.length] + '"></span>' +
      '<a class="hln-body" href="' + P("evento.html?id=" + e.id) + '">' +
      '<span class="hln-title">' + UI.esc(e.title) + '</span>' +
      '<span class="hln-venue">' + UI.esc(venue.name) + ' · ' + UI.dateShort(e.date) + '</span>' +
      '</a>' +
      '<span class="hln-price">' + UI.money(S.minPrice(e)) + '</span>' +
      '</li>'
    );
  }).join("");

  const heroStats = [
    ["Eventos activos", st.liveEvents, "", "en 12 recintos de CDMX"],
    ["Comisión Boletix", 7, "%", "plana, más IVA. Siempre."],
    ["Cargos ocultos", 0, "", "el precio grande es el final"],
    ["Reembolso", 72, " h", "hasta 48 h antes del evento"],
  ];
  document.getElementById("hero-stats").innerHTML = heroStats.map(function (s) {
    return '<div class="card card-flat" style="padding:var(--s3)">' +
      '<div class="stat-value" style="font-size:var(--t-xl)"><span data-countup="' + s[1] + '" data-suffix="' + s[2] + '">0' + s[2] + "</span></div>" +
      '<div class="t-sm" style="font-weight:600">' + s[0] + "</div>" +
      '<div class="t-xs txt-3">' + s[3] + "</div></div>";
  }).join("");

  /* ---------- Próximos ---------- */
  document.getElementById("rail-soon").innerHTML =
    upcoming.slice(0, 8).map(UI.eventCard).join("");

  /* ---------- En tendencia ---------- */
  const trending = upcoming.filter((e) => e.trending).concat(upcoming.filter((e) => !e.trending));
  document.getElementById("grid-trending").innerHTML =
    trending.slice(0, 8).map(UI.eventCard).join("");

  /* ---------- Comparador de precio ---------- */
  const selEv = document.getElementById("cmp-event");
  const selQty = document.getElementById("cmp-qty");
  const out = document.getElementById("cmp-out");
  selEv.innerHTML = upcoming.slice(0, 12).map(function (e) {
    return '<option value="' + e.id + '">' + UI.esc(e.title) + " — " + UI.money(S.minPrice(e)) + "</option>";
  }).join("");

  function renderCompare() {
    const ev = S.event(selEv.value);
    const qty = Number(selQty.value);
    const zone = ev.zones.reduce((a, b) => (a.price < b.price ? a : b));
    const b = BX.breakdown(zone.price, qty);
    const rivalFee = b.subtotal * BX.CONFIG.competitorFeeRate;
    out.innerHTML =
      '<div class="vs-grid">' +
      '<div class="vs-cell is-them"><div class="eyebrow" style="margin-bottom:var(--s2)">Boletera tradicional</div>' +
      '<div class="vs-amount">' + UI.money(b.rival) + "</div>" +
      '<div class="t-sm txt-2" style="margin-top:4px">Cargo por servicio de ' + Math.round(BX.CONFIG.competitorFeeRate * 100) + "%</div>" +
      '<div class="t-xs txt-3">revelado en el último paso</div></div>' +
      '<div class="vs-cell is-us"><div class="eyebrow" style="margin-bottom:var(--s2);color:var(--accent)">Boletix</div>' +
      '<div class="vs-amount">' + UI.money(b.total) + "</div>" +
      '<div class="t-sm txt-2" style="margin-top:4px">Cargo plano de 7%</div>' +
      '<div class="t-xs txt-3">visible desde la búsqueda</div></div>' +
      "</div>" +
      '<div class="price-block"><div class="eyebrow" style="margin-bottom:var(--s2)">Desglose · ' +
      UI.esc(zone.name) + " × " + qty + "</div>" +
      '<div class="price-line"><span>Boletos (' + qty + " × " + UI.money(zone.price) + ")</span><strong>" + UI.money2(b.subtotal) + "</strong></div>" +
      '<div class="price-line"><span>Cargo por servicio Boletix (7%)</span><strong>' + UI.money2(b.fee) + "</strong></div>" +
      '<div class="price-line"><span>IVA sobre el cargo (16%)</span><strong>' + UI.money2(b.iva) + "</strong></div>" +
      '<div class="price-total"><span style="font-weight:700">Pagas</span><span class="amount">' + UI.money2(b.total) + "</span></div>" +
      "</div>" +
      '<div class="savings">' + UI.icon("check", 17) +
      "Te ahorras " + UI.money(b.savings) + " frente a un cargo de " + Math.round(BX.CONFIG.competitorFeeRate * 100) +
      "% (" + UI.money(rivalFee) + " de comisión contra " + UI.money(b.fee) + ").</div>" +
      '<p class="t-xs txt-3" style="margin:0">Referencia de mercado: cargos por servicio del 15% al 20% habituales en boleteras tradicionales, más gastos de gestión y entrega.</p>';
  }
  selEv.addEventListener("change", renderCompare);
  selQty.addEventListener("change", renderCompare);
  renderCompare();

  /* ---------- Dolores del mercado ---------- */
  document.getElementById("pain-grid").innerHTML = BX.PAIN_POINTS.map(function (p) {
    return (
      '<article class="card stack stack-3" style="height:100%">' +
      '<div class="row between"><span style="color:var(--accent)">' + UI.icon(p.icon, 22) + "</span>" +
      '<span class="badge badge-rosa">' + UI.esc(p.feature) + "</span></div>" +
      '<h3 style="font-size:var(--t-md)">' + UI.esc(p.pain) + "</h3>" +
      '<p class="t-sm txt-3" style="margin:0">' + UI.esc(p.evidence) + "</p>" +
      '<hr class="divider">' +
      '<p class="t-sm" style="margin:0"><strong>Qué hicimos.</strong> ' + UI.esc(p.fix) + "</p>" +
      '<a class="link t-sm" href="' + UI.url(p.where) + '" style="margin-top:auto">Ver en el sitio ' + UI.icon("right", 13) + "</a>" +
      "</article>"
    );
  }).join("");

  /* ---------- Reventa ---------- */
  document.getElementById("resale-teaser").innerHTML = S.resale().slice(0, 3).map(function (r) {
    const ev = S.event(r.eventId);
    const z = S.zone(ev, r.zoneId);
    if (!ev || !z) return "";
    return (
      '<a class="card row between" href="' + P("reventa.html") + '" style="gap:var(--s3)">' +
      '<div class="stack stack-1 grow">' +
      '<span class="t-xs mono txt-3">' + UI.dateShort(ev.date) + "</span>" +
      '<strong style="font-size:var(--t-base)">' + UI.esc(ev.title) + "</strong>" +
      '<span class="t-sm txt-2">' + UI.esc(z.name) + " · " + r.qty + (r.qty === 1 ? " boleto" : " boletos") + " · " + UI.esc(r.sellerName) + "</span>" +
      "</div>" +
      '<div class="right stack stack-1">' +
      '<span class="mono" style="font-weight:500">' + UI.money(BX.ptr(r.price)) + "</span>" +
      '<span class="badge badge-jade">Al precio original</span>' +
      "</div></a>"
    );
  }).join("");

  /* ---------- B2B ---------- */
  document.getElementById("b2b-stats").innerHTML = [
    ["48 h", "Dispersión de fondos tras el evento"],
    ["0%", "Cuota de alta o exclusividad"],
    ["Tiempo real", "Panel de ventas y aforo"],
    ["Exportable", "Datos de tu público, tuyos"],
  ].map(function (s) {
    return '<div class="card card-flat" style="padding:var(--s3)">' +
      '<div class="mono" style="font-size:var(--t-lg);font-weight:500">' + s[0] + "</div>" +
      '<div class="t-sm txt-2">' + s[1] + "</div></div>";
  }).join("");

  /* ---------- Cuentas de prueba ---------- */
  const roleLabel = { fan: "Comprador", promotor: "Promotor B2B", admin: "Administrador", staff: "Personal de puerta" };
  document.getElementById("demo-accounts").innerHTML = BX.USERS.map(function (u) {
    return (
      '<button class="card card-flat stack stack-1" style="padding:var(--s3);text-align:left;cursor:pointer;border:1px solid var(--line)" ' +
      'data-email="' + u.email + '">' +
      '<span class="badge">' + roleLabel[u.role] + "</span>" +
      '<span style="font-weight:600;font-size:var(--t-sm)">' + UI.esc(u.name.split(" —")[0]) + "</span>" +
      '<span class="t-xs mono txt-3">' + u.email + "</span></button>"
    );
  }).join("");
  document.getElementById("demo-accounts").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-email]");
    if (!btn) return;
    const r = S.login(btn.dataset.email, "boletix123");
    if (r.ok) {
      UI.toast("Entraste como " + r.user.name, "ok");
      setTimeout(() => (location.href = BX.app.homeFor(r.user)), 500);
    }
  });

  UI.hydratePosters();
})();
