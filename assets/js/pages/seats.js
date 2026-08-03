/* BOLETIX — Selección de asientos */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["fan"]);
  if (!user) return;

  const cart = S.cart();
  const root = document.getElementById("seat-root");
  if (!cart) {
    root.innerHTML =
      '<div class="empty"><div class="empty-mark">' + UI.icon("clock", 24) + "</div>" +
      "<h2>Tu apartado expiró</h2>" +
      '<p class="txt-2 t-sm" style="max-width:44ch">Los lugares volvieron al inventario después de ' +
      BX.CONFIG.holdMinutes + " minutos. Vuelve a elegir tu zona para formarte de nuevo.</p>" +
      '<a class="btn btn-primary" href="eventos.html">Ver la cartelera</a></div>';
    return;
  }

  const ev = S.event(cart.eventId);
  const zone = S.zone(ev, cart.zoneId);
  const venue = S.venue(ev.venueId);
  const qty = cart.qty;
  let picked = [];

  const ROWS = zone.rows || 8;
  const PER_ROW = zone.perRow || 24;
  const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

  /* Ocupación reproducible: mismo evento, mismos asientos ocupados siempre. */
  const occupancy = zone.sold / zone.capacity;
  function isTaken(r, c) {
    const h = UI.hash(ev.id + zone.id + r + "-" + c);
    return (h % 1000) / 1000 < occupancy;
  }
  function seatLabel(r, c) { return LETTERS[r] + "-" + String(c + 1).padStart(2, "0"); }

  /* ---------- Plano ---------- */
  function seatmapSVG() {
    const cell = 12, gap = 3, pad = 14;
    const aisleAfter = Math.floor(PER_ROW / 2);
    const w = pad * 2 + PER_ROW * (cell + gap) + 14;
    const h = pad * 2 + 30 + ROWS * (cell + gap + 3);
    let out = "";

    // Escenario
    out += '<rect x="' + (w * 0.22) + '" y="6" width="' + (w * 0.56) + '" height="16" rx="4" fill="var(--txt-3)" opacity=".45"/>';
    out += '<text x="' + (w / 2) + '" y="17.5" font-size="9" fill="var(--bg)" text-anchor="middle" font-family="DM Mono, monospace" letter-spacing="1">ESCENARIO</text>';

    for (let r = 0; r < ROWS; r++) {
      const y = pad + 30 + r * (cell + gap + 3);
      out += '<text x="4" y="' + (y + cell - 2) + '" font-size="8" fill="var(--txt-3)" font-family="DM Mono, monospace">' + LETTERS[r] + "</text>";
      for (let c = 0; c < PER_ROW; c++) {
        const extra = c >= aisleAfter ? 10 : 0;
        const x = pad + c * (cell + gap) + extra;
        const taken = isTaken(r, c);
        const label = seatLabel(r, c);
        const sel = picked.indexOf(label) >= 0;
        out +=
          '<rect class="seat' + (taken ? " is-taken" : "") + (sel ? " is-picked" : "") + '" ' +
          'data-seat="' + label + '" ' + (taken ? 'aria-disabled="true" ' : 'tabindex="0" role="button" ') +
          'aria-label="Asiento ' + label + (taken ? " ocupado" : sel ? " seleccionado" : " disponible") + '" ' +
          'x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="2.5" ' +
          'fill="' + (sel ? "var(--txt)" : taken ? "var(--txt-3)" : zone.color) + '" ' +
          (sel ? 'stroke="' + zone.color + '" stroke-width="2"' : "") + "/>";
      }
    }
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="seatmap" style="padding:8px" ' +
      'role="group" aria-label="Plano de asientos de ' + UI.esc(zone.name) + '">' + out + "</svg>";
  }

  /* ---------- Vista ---------- */
  function render() {
    const b = BX.breakdown(cart.unitPrice, qty);
    root.innerHTML =
      '<div class="stack stack-5">' +

      '<div class="stack stack-2">' +
      '<span class="eyebrow">' + UI.esc(venue.name) + " · " + UI.esc(zone.name) + "</span>" +
      "<h1 style=\"font-size:var(--t-2xl)\">Elige " + qty + (qty === 1 ? " asiento" : " asientos") + "</h1>" +
      '<p class="txt-2 t-sm" style="margin:0">Los asientos en gris ya están ocupados. Toca los que quieras; puedes cambiarlos hasta que pagues.</p>' +
      "</div>" +

      '<div class="row row-wrap zone-legend">' +
      '<span class="row" style="gap:6px"><i class="zone-dot" style="background:' + zone.color + '"></i>Disponible</span>' +
      '<span class="row" style="gap:6px"><i class="zone-dot" style="background:var(--txt)"></i>Tu selección</span>' +
      '<span class="row" style="gap:6px"><i class="zone-dot" style="background:var(--txt-3);opacity:.4"></i>Ocupado</span>' +
      "</div>" +

      '<div class="scroll-x" id="map-host">' + seatmapSVG() + "</div>" +

      '<div class="grid g-md-2" style="gap:var(--s4);align-items:start">' +

      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Tu selección</h3>' +
      '<span class="badge' + (picked.length === qty ? " badge-jade" : "") + '">' + picked.length + " de " + qty + "</span></div>" +
      '<div class="panel-body stack stack-3">' +
      (picked.length
        ? '<div class="row row-wrap" style="gap:var(--s2)">' +
          picked.map((s) => '<span class="badge badge-rosa" style="font-size:var(--t-sm);padding:.35rem .6rem">' + s +
            ' <button data-unpick="' + s + '" aria-label="Quitar asiento ' + s + '" style="background:none;border:0;color:inherit;cursor:pointer;padding:0 0 0 4px">×</button></span>').join("") +
          "</div>"
        : '<p class="txt-3 t-sm" style="margin:0">Aún no eliges asientos. Toca el plano de arriba.</p>') +
      '<button class="btn btn-ghost btn-sm" id="auto-pick">Elegir los mejores disponibles por mí</button>' +
      "</div></div>" +

      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Total</h3>' +
      '<span class="countdown t-sm" id="seat-clock"></span></div>' +
      '<div class="panel-body stack stack-3">' +
      '<div class="price-block">' +
      '<div class="price-line"><span>' + qty + " × " + UI.esc(zone.name) + "</span><strong>" + UI.money2(b.subtotal) + "</strong></div>" +
      '<div class="price-line"><span>Cargo por servicio (7%)</span><strong>' + UI.money2(b.fee) + "</strong></div>" +
      '<div class="price-line"><span>IVA sobre el cargo</span><strong>' + UI.money2(b.iva) + "</strong></div>" +
      '<div class="price-total"><span style="font-weight:700">Pagas</span><span class="amount">' + UI.money2(b.total) + "</span></div>" +
      "</div>" +
      '<button class="btn btn-primary btn-lg btn-block" id="seat-go"' + (picked.length === qty ? "" : " disabled") + ">Continuar al pago</button>" +
      "</div></div>" +

      "</div></div>";

    document.getElementById("seat-actionbar").innerHTML =
      '<div class="actionbar">' +
      '<div class="stack stack-1 grow"><span class="t-xs txt-3">' + picked.length + " de " + qty + " asientos</span>" +
      '<span class="mono" style="font-weight:500">' + UI.money(b.total) + "</span></div>" +
      '<button class="btn btn-primary" id="seat-go-m" style="flex:none"' + (picked.length === qty ? "" : " disabled") + ">Pagar</button>" +
      "</div>";

    bind();
  }

  function toggleSeat(label) {
    const i = picked.indexOf(label);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length >= qty) {
      UI.toast("Ya elegiste " + qty + ". Quita uno para cambiarlo.", "err");
      return;
    } else picked.push(label);
    render();
  }

  function bind() {
    const host = document.getElementById("map-host");
    host.addEventListener("click", function (e) {
      const s = e.target.closest("[data-seat]");
      if (!s || s.classList.contains("is-taken")) return;
      toggleSeat(s.dataset.seat);
    });
    host.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const s = e.target.closest("[data-seat]");
      if (!s || s.classList.contains("is-taken")) return;
      e.preventDefault();
      toggleSeat(s.dataset.seat);
    });
    root.addEventListener("click", function (e) {
      const u = e.target.closest("[data-unpick]");
      if (u) toggleSeat(u.dataset.unpick);
    });

    document.getElementById("auto-pick").addEventListener("click", function () {
      // Busca la mejor corrida de asientos juntos, empezando por las filas de enfrente.
      picked = [];
      outer:
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= PER_ROW - qty; c++) {
          let ok = true;
          for (let k = 0; k < qty; k++) if (isTaken(r, c + k)) { ok = false; break; }
          if (ok) {
            for (let k = 0; k < qty; k++) picked.push(seatLabel(r, c + k));
            break outer;
          }
        }
      }
      if (picked.length) UI.toast("Elegimos " + picked.join(", ") + " — juntos y lo más al frente posible.", "ok");
      else UI.toast("No hay " + qty + " asientos juntos en esta zona. Elige manualmente.", "err");
      render();
    });

    function go() {
      if (picked.length !== qty) return;
      S.setCart(Object.assign({}, cart, { seats: picked.slice().sort() }));
      S.extendCart(BX.CONFIG.holdMinutes);
      location.href = "checkout.html";
    }
    const g1 = document.getElementById("seat-go"), g2 = document.getElementById("seat-go-m");
    if (g1) g1.addEventListener("click", go);
    if (g2) g2.addEventListener("click", go);
  }

  /* ---------- Reloj del apartado ---------- */
  setInterval(function () {
    const c = S.cart();
    const el = document.getElementById("seat-clock");
    if (!c) {
      UI.toast("Se acabó el tiempo del apartado.", "err");
      setTimeout(() => (location.href = "evento.html?id=" + ev.id), 800);
      return;
    }
    if (el) {
      const left = c.expiresAt - Date.now();
      el.textContent = UI.clock(left) + " para pagar";
      el.classList.toggle("is-low", left < 120000);
    }
  }, 1000);

  render();
})();
