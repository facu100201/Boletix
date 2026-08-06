/* BOLETIX — Mercado de Reventa Justa */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const list = document.getElementById("rv-list");
  const sel = document.getElementById("rv-cat");
  let cat = "";

  /* ---------- Cifras ---------- */
  function renderStats() {
    const items = S.resale().filter(alive);
    const tickets = items.reduce((s, r) => s + r.qty, 0);
    const saved = items.reduce(function (s, r) {
      // Lo que costaría ese boleto con un sobreprecio típico del mercado externo.
      return s + (BX.ptr(r.price) * 2.5 - BX.ptr(r.price)) * r.qty;
    }, 0);
    document.getElementById("rv-stats").innerHTML = [
      ["Boletos publicados", '<span data-countup="' + tickets + '">0</span>', "de " + items.length + " vendedores"],
      ["Sobreprecio permitido", "0%", "tope duro al valor original"],
      ["Comisión al vendedor", "0%", "recuperas lo que pagaste"],
      ["Ahorro estimado", UI.compact(saved), "vs. reventa externa"],
    ].map(function (s) {
      return '<div class="card card-flat" style="padding:var(--s3)">' +
        '<div class="stat-value" style="font-size:var(--t-lg)">' + s[1] + "</div>" +
        '<div class="t-sm" style="font-weight:600">' + s[0] + "</div>" +
        '<div class="t-xs txt-3">' + s[2] + "</div></div>";
    }).join("");
  }

  function alive(r) {
    const ev = S.event(r.eventId);
    return ev && !ev.past;
  }

  /* ---------- Filtro ---------- */
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    BX.CATEGORIES.map((c) => '<option value="' + c.id + '">' + c.name + "</option>").join("");
  sel.addEventListener("change", function () { cat = sel.value; render(); });

  /* ---------- Listado ---------- */
  function render() {
    const items = S.resale().filter(function (r) {
      if (!alive(r)) return false;
      if (cat && S.event(r.eventId).category !== cat) return false;
      return true;
    });

    if (!items.length) {
      list.innerHTML =
        '<div class="empty"><div class="empty-mark">' + UI.icon("swap", 24) + "</div>" +
        "<h3>Ahorita no hay boletos en reventa</h3>" +
        '<p class="txt-2 t-sm" style="max-width:44ch">Es buena señal: significa que la gente sí va a ir. ' +
        "Activa el aviso en el evento que te interesa y te escribimos en cuanto alguien publique.</p>" +
        '<a class="btn btn-primary" href="eventos.html">Ver la cartelera</a></div>';
      return;
    }

    list.innerHTML = items.map(function (r) {
      const ev = S.event(r.eventId);
      const z = S.zone(ev, r.zoneId);
      const venue = S.venue(ev.venueId);
      const total = BX.ptr(r.price);
      const externo = Math.round(total * 2.5);
      return (
        '<article class="card" style="padding:var(--s3)">' +
        '<div class="row" style="gap:var(--s3);align-items:flex-start">' +
        '<div style="width:66px;flex:none">' + UI.posterHTML(ev, {}) + "</div>" +

        '<div class="stack stack-2 grow" style="min-width:0">' +
        '<div class="stack stack-1">' +
        '<span class="t-xs mono txt-3">' + UI.dateShort(ev.date) + " · " + UI.time(ev.date) + " h</span>" +
        '<strong style="font-size:var(--t-md);line-height:1.2">' + UI.esc(ev.title) + "</strong>" +
        '<span class="t-sm txt-2">' + UI.esc(venue.name) + " · " + UI.esc(z.name) + "</span>" +
        "</div>" +
        '<div class="row row-wrap" style="gap:6px">' +
        '<span class="badge badge-jade">' + UI.icon("lock", 12) + " Precio original</span>" +
        '<span class="badge">' + r.qty + (r.qty === 1 ? " boleto" : " boletos") + "</span>" +
        '<span class="badge">' + UI.esc(r.sellerName) + "</span>" +
        "</div>" +
        '<span class="t-xs txt-3">Publicado ' + UI.relative(r.listedAt) + " · " + UI.esc(r.reason) + "</span>" +
        "</div>" +

        '<div class="right stack stack-2" style="flex:none">' +
        '<div><div class="mono" style="font-weight:500;font-size:var(--t-md)">' + UI.money(total) + "</div>" +
        '<div class="t-xs txt-3">total por boleto</div></div>' +
        '<div class="t-xs" style="color:var(--txt-3);text-decoration:line-through">' + UI.money(externo) + " afuera</div>" +
        '<button class="btn btn-primary btn-sm" data-buy="' + r.id + '">Comprar</button>' +
        "</div></div></article>"
      );
    }).join("");

    UI.hydratePosters(list);
  }

  /* ---------- Compra ---------- */
  list.addEventListener("click", function (e) {
    const b = e.target.closest("[data-buy]");
    if (!b) return;
    const r = S.resale().find((x) => x.id === b.dataset.buy);
    if (!r) return;

    const user = S.session();
    if (!user) {
      location.href = "login.html?next=" + encodeURIComponent("reventa.html");
      return;
    }
    if (user.role !== "fan") {
      UI.toast("Las cuentas de " + user.role + " no compran boletos.", "err");
      return;
    }

    const ev = S.event(r.eventId);
    const z = S.zone(ev, r.zoneId);
    const maxQty = Math.min(r.qty, S.remainingAllowance(user.id, ev.id));
    if (maxQty < 1) {
      UI.toast("Ya tienes el máximo de " + BX.CONFIG.maxTicketsPerAccount + " boletos de este evento.", "err");
      return;
    }

    UI.modal({
      title: "Comprar boleto en reventa",
      body:
        '<div class="stack stack-4">' +
        '<div class="card card-flat stack stack-2">' +
        "<strong>" + UI.esc(ev.title) + "</strong>" +
        '<span class="t-sm txt-2">' + UI.dateLong(ev.date) + " · " + UI.esc(z.name) + "</span>" +
        '<span class="t-sm txt-2">Vendedor: ' + UI.esc(r.sellerName) + " · " + UI.esc(r.reason) + "</span>" +
        "</div>" +
        '<div class="field"><label class="label" for="rv-qty">Cuántos quieres</label>' +
        '<select class="select" id="rv-qty">' +
        Array.from({ length: maxQty }, (_, i) => "<option>" + (i + 1) + "</option>").join("") +
        "</select></div>" +
        '<div id="rv-break"></div>' +
        '<div class="note note-jade"><span>' + UI.icon("shield", 18) + "</span><div class=\"t-sm\">" +
        "El código del vendedor se anula en cuanto pagas y tú recibes uno nuevo a tu nombre. " +
        "Nadie puede entrar con el boleto que compraste.</div></div>" +
        "</div>",
      actions: [
        { label: "Cancelar", variant: "btn-ghost" },
        {
          label: "Pagar", variant: "btn-primary", onClick: function (body) {
            const qty = Number(body.querySelector("#rv-qty").value);
            const res = S.placeOrder({
              eventId: ev.id, zoneId: z.id, qty: qty,
              unitPrice: r.price, seats: null,
              method: "Reventa Justa · " + (user.cards.length ? user.cards[0].brand + " ••" + user.cards[0].last4 : "Tarjeta"),
            });
            if (!res.ok) { UI.toast(res.error, "err"); return false; }
            r.qty -= qty;
            if (r.qty <= 0) S.cancelListing(r.id);
            else S.save();
            location.href = "confirmacion.html?orden=" + res.order.id;
          }
        },
      ],
      onClose: function () {},
    });

    const qtySel = document.getElementById("rv-qty");
    const out = document.getElementById("rv-break");
    function sync() {
      const b2 = BX.breakdown(r.price, Number(qtySel.value));
      out.innerHTML =
        '<div class="price-block">' +
        '<div class="price-line"><span>' + qtySel.value + " × " + UI.money(r.price) + " (precio original)</span><strong>" + UI.money2(b2.subtotal) + "</strong></div>" +
        '<div class="price-line"><span>Cargo por servicio (7%)</span><strong>' + UI.money2(b2.fee) + "</strong></div>" +
        '<div class="price-line"><span>IVA sobre el cargo</span><strong>' + UI.money2(b2.iva) + "</strong></div>" +
        '<div class="price-line"><span>Sobreprecio de reventa</span><strong style="color:var(--jade)">' + UI.money2(0) + "</strong></div>" +
        '<div class="price-total"><span style="font-weight:700">Pagas</span><span class="amount">' + UI.money2(b2.total) + "</span></div>" +
        "</div>";
    }
    qtySel.addEventListener("change", sync);
    sync();
  });

  /* ---------- Cómo funciona ---------- */
  document.getElementById("rv-how").innerHTML = [
    ["tag", "El precio no se puede subir", "El campo de precio está fijado al valor original de compra y no es editable. No existe forma de publicar más caro, ni siquiera desde el panel del promotor."],
    ["swap", "La transferencia es verificada", "El boleto se mueve entre cuentas dentro de Boletix. El código del vendedor se anula en el mismo instante en que el comprador paga."],
    ["money", "El vendedor recupera todo", "No cobramos comisión por revender. Quien publica recibe exactamente lo que pagó por el boleto, sin descuentos."],
  ].map(function (h) {
    return '<article class="card stack stack-3">' +
      '<span style="color:var(--accent)">' + UI.icon(h[0], 22) + "</span>" +
      '<h3 style="font-size:var(--t-md)">' + h[1] + "</h3>" +
      '<p class="t-sm txt-2" style="margin:0">' + h[2] + "</p></article>";
  }).join("");

  renderStats();
  render();
})();
