/* BOLETIX — Cómo cobramos y por qué */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  /* ---------- Conceptos que no cobramos ---------- */
  document.getElementById("tr-nope").innerHTML = [
    "Gastos de gestión", "Gastos de envío digital", "Cargo por impresión",
    "Cargo por elegir asiento", "Cargo por pagar con tarjeta", "Cuota de plataforma",
    "Seguro de cancelación", "Cargo por acceso anticipado",
  ].map((c) => '<span class="badge" style="text-decoration:line-through;opacity:.75">' + c + "</span>").join("");

  /* ---------- Calculadora ---------- */
  const calc = document.getElementById("tr-calc");
  function renderCalc(price) {
    const b = BX.breakdown(price, 1);
    calc.innerHTML =
      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Calculadora</h3></div>' +
      '<div class="panel-body stack stack-4">' +
      '<div class="field"><label class="label" for="tr-price">Precio del boleto: <span class="mono" id="tr-price-out">' +
      UI.money(price) + "</span></label>" +
      '<input type="range" class="input" id="tr-price" min="100" max="4000" step="50" value="' + price + '" style="padding:0;min-height:auto"></div>' +
      '<div class="price-block">' +
      '<div class="price-line"><span>Precio del boleto</span><strong>' + UI.money2(b.subtotal) + "</strong></div>" +
      '<div class="price-line"><span>Comisión Boletix (7%)</span><strong>' + UI.money2(b.fee) + "</strong></div>" +
      '<div class="price-line"><span>IVA sobre la comisión (16%)</span><strong>' + UI.money2(b.iva) + "</strong></div>" +
      '<div class="price-total"><span style="font-weight:700">Pagas</span><span class="amount">' + UI.money2(b.total) + "</span></div>" +
      "</div>" +
      '<div class="vs-grid">' +
      '<div class="vs-cell is-them"><div class="eyebrow" style="margin-bottom:6px">Con cargo del 20%</div>' +
      '<div class="vs-amount">' + UI.money(b.rival) + "</div></div>" +
      '<div class="vs-cell is-us"><div class="eyebrow" style="margin-bottom:6px;color:var(--accent)">Boletix</div>' +
      '<div class="vs-amount">' + UI.money(b.total) + "</div></div>" +
      "</div>" +
      '<div class="savings">' + UI.icon("check", 16) + "Diferencia de " + UI.money(b.savings) + " por boleto</div>" +
      '<p class="t-xs txt-3" style="margin:0">Al comprar cuatro boletos al año, esa diferencia suma ' +
      UI.money(b.savings * 4) + " anuales.</p>" +
      "</div></div>";

    const range = document.getElementById("tr-price");
    range.addEventListener("input", function () {
      document.getElementById("tr-price-out").textContent = UI.money(range.value);
    });
    range.addEventListener("change", function () { renderCalc(Number(range.value)); });
  }
  renderCalc(700);

  /* ---------- Ilustración de la fila ---------- */
  document.getElementById("tr-queue").innerHTML =
    '<div class="stack stack-2 center-txt">' +
    '<span class="eyebrow">Personas delante de ti</span>' +
    '<div class="queue-pos" id="tr-pos">1,284</div>' +
    '<span class="t-sm txt-2">Tiempo estimado: <strong>~2 min</strong></span>' +
    "</div>" +
    '<div class="queue-meter"><i id="tr-bar" style="width:22%"></i></div>' +
    '<div class="note note-jade"><span>' + UI.icon("lock", 18) + "</span><div class=\"t-sm\">" +
    "<strong>Precio congelado en $749.</strong> No cambia mientras esperas.</div></div>" +
    '<div class="stack stack-2 t-sm txt-2">' +
    "<div>· La posición sale de la cola real del servidor.</div>" +
    "<div>· Cerrar la pestaña no pierde tu lugar.</div>" +
    "<div>· El inventario completo está a la venta desde el minuto uno. No lo liberamos por tandas.</div>" +
    "</div>";

  (function animateQueue() {
    let pos = 1284;
    const el = document.getElementById("tr-pos");
    const bar = document.getElementById("tr-bar");
    setInterval(function () {
      pos = pos <= 40 ? 1284 : pos - Math.round(20 + Math.random() * 60);
      el.textContent = UI.numf(pos);
      bar.style.width = Math.round((1 - pos / 1284) * 100) + "%";
    }, 900);
  })();

  /* ---------- QR en vivo ---------- */
  const qr = document.getElementById("tr-qr");
  const demoCode = "BTX-DEMO-001";
  function paint() { UI.paintQR(qr, UI.rotatingToken(demoCode)); }
  paint();
  let last = UI.rotatingToken(demoCode);
  setInterval(function () {
    const now = UI.rotatingToken(demoCode);
    const secs = UI.tokenSecondsLeft();
    document.getElementById("tr-qrbar").style.width = (secs / BX.CONFIG.qrRotateSeconds) * 100 + "%";
    document.getElementById("tr-qrsecs").textContent = secs;
    if (now !== last) { last = now; paint(); }
  }, 500);
  window.addEventListener("resize", paint);

  /* ---------- Reventa: comparación ---------- */
  const sample = S.upcoming()[0];
  const p = S.minPrice(sample);
  document.getElementById("tr-resale").innerHTML =
    '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Un boleto de ' + UI.money(p) + "</h3></div>" +
    '<div class="panel-body stack stack-3">' +
    [["Precio original", p, "var(--txt)"],
     ["Reventa en Boletix", p, "var(--jade)"],
     ["Reventa externa típica (×2.5)", p * 2.5, "var(--ambar)"],
     ["Sobreprecio documentado (×5)", p * 5, "var(--rojo)"]].map(function (r) {
      const pct = Math.round((r[1] / (p * 5)) * 100);
      return '<div class="stack stack-1">' +
        '<div class="row between t-sm"><span class="txt-2">' + r[0] + '</span><strong class="mono" style="color:' + r[2] + '">' + UI.money(r[1]) + "</strong></div>" +
        '<div class="bar-track"><i style="width:' + pct + "%;background:" + r[2] + '"></i></div></div>';
    }).join("") +
    '<p class="t-xs txt-3" style="margin:0">Las dos últimas barras son referencias del mercado secundario externo. ' +
    "En Boletix esos precios no se pueden capturar.</p>" +
    "</div></div>";

  /* ---------- Reembolso: plazos ---------- */
  document.getElementById("tr-refund").innerHTML =
    [["Boletix", 72, "var(--jade)", "Autoservicio, comisión incluida"],
     ["Compromiso del sector", 504, "var(--ambar)", "21 días naturales vía conciliación"],
     ["Sin compromiso público", 720, "var(--rojo)", "Hasta 30 días, caso por caso"]].map(function (r) {
      const pct = Math.round((r[1] / 720) * 100);
      const dias = r[1] >= 24 ? Math.round(r[1] / 24) + " días" : r[1] + " h";
      return '<div class="stack stack-1">' +
        '<div class="row between t-sm"><span style="font-weight:600">' + r[0] + '</span><strong class="mono" style="color:' + r[2] + '">' +
        (r[1] === 72 ? "72 h" : dias) + "</strong></div>" +
        '<div class="bar-track"><i style="width:' + pct + "%;background:" + r[2] + '"></i></div>' +
        '<span class="t-xs txt-3">' + r[3] + "</span></div>";
    }).join("") +
    '<p class="t-xs txt-3" style="margin:0">Además devolvemos el cargo por servicio, que la mayoría retiene.</p>';

  /* ---------- Dolores ---------- */
  document.getElementById("tr-pains").innerHTML = BX.PAIN_POINTS.map(function (pp) {
    return '<article class="card stack stack-3">' +
      '<span style="color:var(--accent)">' + UI.icon(pp.icon, 22) + "</span>" +
      '<h3 style="font-size:var(--t-base)">' + UI.esc(pp.pain) + "</h3>" +
      '<p class="t-sm txt-3" style="margin:0">' + UI.esc(pp.evidence) + "</p>" +
      '<hr class="divider">' +
      '<p class="t-sm" style="margin:0"><strong>' + UI.esc(pp.feature) + ".</strong> " + UI.esc(pp.fix) + "</p>" +
      "</article>";
  }).join("");

  /* ---------- Fuentes ---------- */
  document.getElementById("tr-sources").innerHTML = [
    "PROFECO — Buró Comercial: 5,652 quejas registradas en el mercado de venta de boletos entre 2022 y 2024.",
    "COFECE (2024) — Estudio de competencia en la comercialización de boletos para espectáculos en vivo.",
    "Imperva (2023) — Bad Bot Report: los bots acaparan entre 15% y 30% del inventario en preventas de alta demanda.",
    "Gobierno del Reino Unido (2025) — Respuesta a la consulta pública sobre prácticas de precio en eventos en vivo: fila opaca y drip pricing como reclamos centrales.",
    "Competition Bureau de Canadá (2023) — Acuerdo por $825,000 con TicketNetwork por publicidad de precios inalcanzables (drip pricing).",
    "AMVO (2025) — Estudio de Venta Online: comportamiento de compra móvil y estacionalidad quincenal en México.",
    "Reportes de prensa y reseñas de tiendas de aplicaciones sobre clonación de códigos y demoras en reembolsos en plataformas mexicanas.",
  ].map((s) => "<div>· " + UI.esc(s) + "</div>").join("");
})();
