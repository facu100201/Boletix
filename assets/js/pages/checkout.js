/* BOLETIX — Pasarela de pago */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["fan"]);
  if (!user) return;

  const root = document.getElementById("co-root");
  const cart = S.cart();

  if (!cart) {
    root.innerHTML =
      '<div class="empty"><div class="empty-mark">' + UI.icon("clock", 24) + "</div>" +
      "<h2>Se acabó el tiempo del apartado</h2>" +
      '<p class="txt-2 t-sm" style="max-width:46ch">Guardamos tus lugares ' + BX.CONFIG.holdMinutes +
      " minutos y luego regresan al inventario para que otra persona los pueda comprar. Nada se te cobró.</p>" +
      '<a class="btn btn-primary" href="eventos.html">Volver a la cartelera</a></div>';
    return;
  }

  const ev = S.event(cart.eventId);
  const zone = S.zone(ev, cart.zoneId);
  const venue = S.venue(ev.venueId);
  const b = BX.breakdown(cart.unitPrice, cart.qty);

  let method = user.cards.length ? "guardada" : "tarjeta";
  let processing = false;

  const METHODS = [
    { id: "guardada", name: "Tarjeta guardada", note: user.cards.length ? user.cards[0].brand + " ••" + user.cards[0].last4 : "", icon: "card", hidden: !user.cards.length },
    { id: "tarjeta", name: "Tarjeta nueva", note: "Débito o crédito", icon: "card" },
    { id: "spei", name: "Transferencia SPEI", note: "CLABE al instante, sin comisión bancaria", icon: "money" },
    { id: "paypal", name: "PayPal", note: "Paga con tu saldo o cuenta ligada", icon: "money" },
    { id: "mercadopago", name: "Mercado Pago", note: "Saldo, tarjeta o meses sin intereses", icon: "money" },
    { id: "efectivo", name: "Efectivo en tienda", note: "Referencia para OXXO, 24 h para pagar", icon: "building" },
  ].filter((m) => !m.hidden);

  /* ---------- Resumen ---------- */
  function summaryHTML() {
    return (
      '<div class="panel" style="position:sticky;top:calc(var(--nav-h) + var(--s4))">' +
      '<div class="panel-head"><h3 style="font-size:var(--t-base)">Resumen</h3>' +
      '<span class="countdown t-sm" id="co-clock"></span></div>' +
      '<div class="panel-body stack stack-4">' +

      '<div class="row" style="gap:var(--s3);align-items:flex-start">' +
      '<div style="width:58px;flex:none">' + UI.posterHTML(ev, {}) + "</div>" +
      '<div class="stack stack-1 grow" style="min-width:0">' +
      "<strong>" + UI.esc(ev.title) + "</strong>" +
      '<span class="t-sm txt-2">' + UI.dateShort(ev.date) + " · " + UI.time(ev.date) + " h</span>" +
      '<span class="t-sm txt-2">' + UI.esc(venue.name) + "</span>" +
      "</div></div>" +

      '<hr class="divider">' +

      '<div class="stack stack-2 t-sm">' +
      '<div class="row between"><span class="txt-2">Zona</span><strong>' + UI.esc(zone.name) + "</strong></div>" +
      '<div class="row between"><span class="txt-2">Boletos</span><strong>' + cart.qty + "</strong></div>" +
      (cart.seats
        ? '<div class="row between"><span class="txt-2">Asientos</span><strong class="mono">' + cart.seats.join(", ") + "</strong></div>"
        : '<div class="row between"><span class="txt-2">Acceso</span><strong>General, sin numerar</strong></div>') +
      "</div>" +

      '<div class="price-block">' +
      '<div class="price-line"><span>Boletos (' + cart.qty + " × " + UI.money(cart.unitPrice) + ")</span><strong>" + UI.money2(b.subtotal) + "</strong></div>" +
      '<div class="price-line"><span>Cargo por servicio Boletix (7%)</span><strong>' + UI.money2(b.fee) + "</strong></div>" +
      '<div class="price-line"><span>IVA sobre el cargo (16%)</span><strong>' + UI.money2(b.iva) + "</strong></div>" +
      '<div class="price-line"><span>Gastos de gestión</span><strong style="color:var(--jade)">' + UI.money2(0) + "</strong></div>" +
      '<div class="price-line"><span>Gastos de envío</span><strong style="color:var(--jade)">' + UI.money2(0) + "</strong></div>" +
      '<div class="price-total"><span style="font-weight:700">Total</span><span class="amount">' + UI.money2(b.total) + "</span></div>" +
      "</div>" +

      '<div class="savings">' + UI.icon("check", 16) + "Ahorras " + UI.money(b.savings) +
      " frente a una boletera con cargo del " + Math.round(BX.CONFIG.competitorFeeRate * 100) + "%</div>" +

      '<p class="t-xs txt-3" style="margin:0">Este es el importe final. No aparecerá ningún concepto adicional ' +
      "en tu estado de cuenta.</p>" +
      "</div></div>"
    );
  }

  /* ---------- Formularios por método ---------- */
  function formFor(m) {
    if (m === "guardada") {
      const c = user.cards[0];
      return (
        '<div class="card card-flat stack stack-3">' +
        '<div class="row between"><div class="row" style="gap:var(--s3)">' +
        '<span class="txt-3">' + UI.icon("card", 22) + "</span>" +
        '<div class="stack stack-1"><strong>' + c.brand + " terminada en " + c.last4 + "</strong>" +
        '<span class="t-xs txt-3">Vence ' + c.exp + " · " + UI.esc(c.holder) + "</span></div></div>" +
        '<span class="badge badge-jade">Guardada</span></div>' +
        '<div class="field"><label class="label" for="cvv-saved">Código de seguridad</label>' +
        '<input class="input mono" id="cvv-saved" inputmode="numeric" maxlength="4" placeholder="•••" style="max-width:120px">' +
        '<span class="hint">Lo pedimos en cada compra. Nunca lo guardamos.</span></div>' +
        "</div>"
      );
    }
    if (m === "tarjeta") {
      return (
        '<div class="stack stack-4">' +
        '<div class="field"><label class="label" for="c-num">Número de tarjeta</label>' +
        '<div style="position:relative">' +
        '<input class="input mono" id="c-num" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" style="padding-right:6.5rem">' +
        '<span class="t-xs txt-3" id="c-brand" style="position:absolute;right:.9rem;top:50%;transform:translateY(-50%)"></span>' +
        "</div><span class=\"error-txt hide\" id=\"c-num-err\">Ese número de tarjeta no es válido.</span></div>" +
        '<div class="field"><label class="label" for="c-name">Nombre como aparece en la tarjeta</label>' +
        '<input class="input" id="c-name" autocomplete="cc-name" placeholder="' + UI.esc(user.name.toUpperCase()) + '"></div>' +
        '<div class="grid g-2" style="gap:var(--s3)">' +
        '<div class="field"><label class="label" for="c-exp">Vencimiento</label>' +
        '<input class="input mono" id="c-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5">' +
        '<span class="error-txt hide" id="c-exp-err">Revisa la fecha.</span></div>' +
        '<div class="field"><label class="label" for="c-cvv">CVV</label>' +
        '<input class="input mono" id="c-cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="4"></div>' +
        "</div>" +
        '<label class="check"><input type="checkbox" id="c-save" checked> <span>Guardar esta tarjeta para próximas compras</span></label>' +
        '<div class="note"><span>' + UI.icon("info", 18) + "</span><div class=\"t-xs\">Prototipo: usa <code class=\"mono\">4242 4242 4242 4242</code> " +
        "con cualquier fecha futura y cualquier CVV. Ningún dato sale de tu navegador.</div></div>" +
        "</div>"
      );
    }
    if (m === "spei") {
      return (
        '<div class="stack stack-3">' +
        '<div class="card card-flat stack stack-3">' +
        '<div class="stack stack-1"><span class="eyebrow">CLABE de un solo uso</span>' +
        '<strong class="mono" style="font-size:var(--t-lg);letter-spacing:.06em">646 180 3210 0044 1827</strong></div>' +
        '<div class="stack stack-1"><span class="eyebrow">Banco / Beneficiario</span>' +
        "<span>STP · Boletix S.A. de C.V.</span></div>" +
        '<div class="stack stack-1"><span class="eyebrow">Importe exacto</span>' +
        '<strong class="mono">' + UI.money2(b.total) + "</strong></div>" +
        "</div>" +
        '<div class="note note-ambar"><span>' + UI.icon("clock", 18) + "</span><div class=\"t-sm\">" +
        "La CLABE es única para esta compra y expira en 30 minutos. En cuanto el banco confirme la transferencia " +
        "(normalmente menos de un minuto) tus boletos aparecen en tu cuenta.</div></div>" +
        "</div>"
      );
    }
    if (m === "efectivo") {
      return (
        '<div class="stack stack-3">' +
        '<div class="card card-flat stack stack-3">' +
        '<div class="stack stack-1"><span class="eyebrow">Referencia de pago</span>' +
        '<strong class="mono" style="font-size:var(--t-lg);letter-spacing:.1em">9302 4471 8865 03</strong></div>' +
        '<div class="stack stack-1"><span class="eyebrow">Importe</span><strong class="mono">' + UI.money2(b.total) + "</strong></div>" +
        '<div class="stack stack-1"><span class="eyebrow">Vence</span><span>En 24 horas</span></div>' +
        "</div>" +
        '<div class="note note-ambar"><span>' + UI.icon("alert", 18) + "</span><div class=\"t-sm\">" +
        "Tus lugares quedan apartados las 24 horas completas, no diez minutos. " +
        "La tienda puede cobrar su propia comisión de servicio; esa no es nuestra y no la controlamos.</div></div>" +
        "</div>"
      );
    }
    const label = m === "paypal" ? "PayPal" : "Mercado Pago";
    return (
      '<div class="card card-flat stack stack-3 center-txt" style="padding:var(--s5)">' +
      '<div style="color:var(--txt-3);display:flex;justify-content:center">' + UI.icon("money", 34) + "</div>" +
      "<strong>Continuar con " + label + "</strong>" +
      '<p class="t-sm txt-2" style="margin:0">Te llevamos a ' + label + " para autorizar " + UI.money(b.total) +
      " y regresas aquí automáticamente.</p></div>"
    );
  }

  /* ---------- Render ---------- */
  function render() {
    root.innerHTML =
      '<div class="grid" style="grid-template-columns:1fr;gap:var(--s5)" id="co-grid">' +

      '<div class="stack stack-5">' +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Datos de contacto</h2>' +
      '<span class="badge badge-jade">' + UI.icon("check", 13) + " Verificado</span></div>" +
      '<div class="panel-body stack stack-3">' +
      '<div class="grid g-md-2" style="gap:var(--s3)">' +
      '<div class="field"><label class="label" for="co-name">Nombre del titular</label>' +
      '<input class="input" id="co-name" value="' + UI.esc(user.name) + '"></div>' +
      '<div class="field"><label class="label" for="co-mail">Correo para tus boletos</label>' +
      '<input class="input" id="co-mail" type="email" value="' + UI.esc(user.email) + '"></div>' +
      "</div>" +
      '<p class="t-xs txt-3" style="margin:0">Los boletos viven en tu cuenta. El correo es sólo el comprobante.</p>' +
      "</div></div>" +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Cómo quieres pagar</h2>' +
      '<span class="badge">' + UI.icon("lock", 13) + " PCI-DSS v4.0</span></div>" +
      '<div class="panel-body stack stack-4">' +
      '<div class="stack stack-2" id="co-methods">' +
      METHODS.map(function (m) {
        const on = m.id === method;
        return '<button class="card' + (on ? "" : " card-flat") + '" data-method="' + m.id + '" ' +
          'style="text-align:left;cursor:pointer;width:100%;border-color:' + (on ? "var(--accent)" : "var(--line)") + '">' +
          '<div class="row" style="gap:var(--s3)">' +
          '<span style="color:' + (on ? "var(--accent)" : "var(--txt-3)") + ';flex:none">' + UI.icon(m.icon, 20) + "</span>" +
          '<div class="stack stack-1 grow"><strong style="font-size:var(--t-base)">' + m.name + "</strong>" +
          (m.note ? '<span class="t-xs txt-3">' + UI.esc(m.note) + "</span>" : "") + "</div>" +
          '<span class="dot" style="background:' + (on ? "var(--accent)" : "transparent") +
          ";box-shadow:0 0 0 1.5px " + (on ? "var(--accent)" : "var(--line-strong)") + ';width:14px;height:14px"></span>' +
          "</div></button>";
      }).join("") +
      "</div>" +
      '<hr class="divider">' +
      '<div id="co-form">' + formFor(method) + "</div>" +
      "</div></div>" +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Lo que aceptas al pagar</h2></div>' +
      '<div class="panel-body stack stack-3">' +
      '<label class="check"><input type="checkbox" id="co-terms"> <span>Acepto los <a class="link" href="legal.html#terminos" target="_blank">términos</a> y el ' +
      '<a class="link" href="legal.html#privacidad" target="_blank">aviso de privacidad</a>.</span></label>' +
      '<div class="note note-jade"><span>' + UI.icon("back", 18) + "</span><div class=\"t-sm\">" +
      "<strong>Puedes arrepentirte.</strong> Reembolso completo con un toque desde tu cuenta hasta " +
      BX.CONFIG.refundHoursBefore + " horas antes del evento. Devolvemos el dinero en un máximo de " +
      BX.CONFIG.refundSlaHours + " horas, incluida la comisión de servicio.</div></div>" +
      '<button class="btn btn-primary btn-lg btn-block" id="co-pay">Pagar ' + UI.money(b.total) + "</button>" +
      '<p class="t-xs txt-3 center-txt" style="margin:0">' + UI.icon("lock", 12) + " Conexión cifrada · Prototipo sin cobros reales</p>" +
      "</div></div>" +

      "</div>" +

      '<aside id="co-aside">' + summaryHTML() + "</aside>" +
      "</div>";

    // Dos columnas en escritorio
    const mq = window.matchMedia("(min-width: 960px)");
    function applyGrid() {
      document.getElementById("co-grid").style.gridTemplateColumns = mq.matches ? "minmax(0,1fr) 380px" : "1fr";
    }
    applyGrid();
    mq.addEventListener("change", applyGrid);

    bind();
    UI.hydratePosters(root);
  }

  /* ---------- Interacción ---------- */
  function bind() {
    document.getElementById("co-methods").addEventListener("click", function (e) {
      const b2 = e.target.closest("[data-method]");
      if (!b2) return;
      method = b2.dataset.method;
      render();
    });

    const num = document.getElementById("c-num");
    if (num) {
      num.addEventListener("input", function () {
        const pos = num.selectionStart;
        num.value = UI.maskCard(num.value);
        document.getElementById("c-brand").textContent = num.value.replace(/\s/g, "").length >= 2 ? UI.cardBrand(num.value) : "";
        if (pos < num.value.length) num.setSelectionRange(pos, pos);
      });
      num.addEventListener("blur", function () {
        const bad = num.value.replace(/\s/g, "").length > 0 && !UI.luhn(num.value);
        num.setAttribute("aria-invalid", bad ? "true" : "false");
        document.getElementById("c-num-err").classList.toggle("hide", !bad);
      });
    }
    const exp = document.getElementById("c-exp");
    if (exp) {
      exp.addEventListener("input", function () {
        let v = exp.value.replace(/\D/g, "").slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
        exp.value = v;
      });
    }
    document.getElementById("co-pay").addEventListener("click", pay);
  }

  /* ---------- Validación ---------- */
  function validate() {
    if (!document.getElementById("co-terms").checked) {
      return "Falta aceptar los términos y el aviso de privacidad.";
    }
    const mail = document.getElementById("co-mail").value.trim();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return "Revisa el correo: ahí llega tu comprobante.";

    if (method === "guardada") {
      const cvv = document.getElementById("cvv-saved").value.trim();
      if (cvv.length < 3) return "Escribe el código de seguridad de tu tarjeta guardada.";
    }
    if (method === "tarjeta") {
      const n = document.getElementById("c-num").value;
      if (!UI.luhn(n)) return "El número de tarjeta no es válido. Revísalo dígito por dígito.";
      if (!document.getElementById("c-name").value.trim()) return "Falta el nombre del titular de la tarjeta.";
      const e2 = document.getElementById("c-exp").value;
      const m2 = /^(\d{2})\/(\d{2})$/.exec(e2);
      if (!m2) return "Escribe el vencimiento como MM/AA.";
      const mm = Number(m2[1]), yy = 2000 + Number(m2[2]);
      if (mm < 1 || mm > 12) return "El mes de vencimiento debe estar entre 01 y 12.";
      if (new Date(yy, mm, 0) < new Date()) return "Esa tarjeta ya venció.";
      if (document.getElementById("c-cvv").value.trim().length < 3) return "Falta el CVV de la tarjeta.";
    }
    return null;
  }

  /* ---------- Cobro ---------- */
  function pay() {
    if (processing) return;
    const err = validate();
    if (err) { UI.toast(err, "err"); return; }

    processing = true;
    const btn = document.getElementById("co-pay");
    btn.innerHTML = '<span class="spin" style="display:inline-flex">' + UI.icon("clock", 18) + "</span> Autorizando…";
    btn.disabled = true;

    // Paso 3-D Secure simulado para tarjetas
    const needs3ds = method === "tarjeta" || method === "guardada";
    setTimeout(function () {
      if (needs3ds) show3DS(finish);
      else finish();
    }, 900);
  }

  function show3DS(done) {
    const m = UI.modal({
      title: "Verificación del banco",
      body:
        '<div class="stack stack-4">' +
        '<div class="note"><span>' + UI.icon("shield", 18) + "</span><div class=\"t-sm\">" +
        "Tu banco pide confirmar esta compra por " + UI.money(b.total) + " en Boletix. " +
        "Es el estándar 3-D Secure y protege tu tarjeta contra cargos no reconocidos.</div></div>" +
        '<div class="field"><label class="label" for="otp">Código de 6 dígitos enviado por SMS</label>' +
        '<input class="input mono" id="otp" inputmode="numeric" maxlength="6" placeholder="••••••" style="letter-spacing:.4em;font-size:var(--t-lg)"></div>' +
        '<p class="t-xs txt-3" style="margin:0">Prototipo: escribe cualquier combinación de 6 dígitos.</p>' +
        "</div>",
      actions: [
        { label: "Cancelar", variant: "btn-ghost", onClick: function () { resetButton(); } },
        {
          label: "Confirmar", variant: "btn-primary", onClick: function (body) {
            const v = body.querySelector("#otp").value.replace(/\D/g, "");
            if (v.length !== 6) {
              UI.toast("El código debe tener 6 dígitos.", "err");
              return false;
            }
            done();
          }
        },
      ],
      onClose: function () { if (processing) resetButton(); },
    });
    setTimeout(() => m.body.querySelector("#otp").focus(), 80);
  }

  function resetButton() {
    processing = false;
    const btn = document.getElementById("co-pay");
    if (btn) { btn.disabled = false; btn.textContent = "Pagar " + UI.money(b.total); }
  }

  function finish() {
    const label = {
      guardada: user.cards.length ? user.cards[0].brand + " ••" + user.cards[0].last4 : "Tarjeta",
      tarjeta: UI.cardBrand(document.getElementById("c-num") ? document.getElementById("c-num").value : "") +
        " ••" + (document.getElementById("c-num") ? document.getElementById("c-num").value.replace(/\D/g, "").slice(-4) : "0000"),
      spei: "Transferencia SPEI",
      paypal: "PayPal",
      mercadopago: "Mercado Pago",
      efectivo: "Efectivo en tienda",
    }[method];

    // Guardar tarjeta nueva si el usuario lo pidió
    const save = document.getElementById("c-save");
    if (method === "tarjeta" && save && save.checked) {
      const raw = document.getElementById("c-num").value.replace(/\D/g, "");
      user.cards.push({
        id: "c" + (user.cards.length + 1),
        brand: UI.cardBrand(raw),
        last4: raw.slice(-4),
        exp: document.getElementById("c-exp").value,
        holder: document.getElementById("c-name").value.toUpperCase(),
      });
      S.updateUser({ cards: user.cards });
    }

    const res = S.placeOrder({
      eventId: cart.eventId, zoneId: cart.zoneId, qty: cart.qty,
      unitPrice: cart.unitPrice, seats: cart.seats, method: label,
    });
    if (!res.ok) { UI.toast(res.error, "err"); resetButton(); return; }
    location.href = "confirmacion.html?orden=" + res.order.id;
  }

  /* ---------- Reloj del apartado ---------- */
  setInterval(function () {
    const c = S.cart();
    const el = document.getElementById("co-clock");
    if (!c && !processing) {
      location.reload();
      return;
    }
    if (el && c) {
      const left = c.expiresAt - Date.now();
      el.textContent = UI.clock(left);
      el.classList.toggle("is-low", left < 120000);
    }
  }, 1000);

  render();
})();
