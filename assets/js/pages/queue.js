/* BOLETIX — Fila virtual transparente */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["fan"]);
  if (!user) return;

  const ev = S.event(UI.param("id"));
  const root = document.getElementById("queue-root");
  if (!ev) { location.href = "eventos.html"; return; }

  const zone = S.zone(ev, UI.param("zona")) || ev.zones[0];
  const qty = Math.max(1, Math.min(Number(UI.param("qty")) || 2, BX.CONFIG.maxTicketsPerAccount));
  const lockedPrice = zone.price;   // el precio que el usuario vio al entrar
  const b = BX.breakdown(lockedPrice, qty);

  let phase = "verify";   // verify -> waiting -> ready
  let q = null;
  let timer = null;

  /* ---------- Vistas ---------- */
  function contextCard() {
    return (
      '<div class="card row" style="gap:var(--s3);align-items:center">' +
      '<div style="width:64px;flex:none">' + UI.posterHTML(ev, {}) + "</div>" +
      '<div class="stack stack-1 grow" style="min-width:0">' +
      '<span class="t-xs mono txt-3">' + UI.dateShort(ev.date) + " · " + UI.time(ev.date) + "</span>" +
      '<strong style="line-height:1.2">' + UI.esc(ev.title) + "</strong>" +
      '<span class="t-sm txt-2">' + UI.esc(zone.name) + " · " + qty + (qty === 1 ? " boleto" : " boletos") + "</span>" +
      "</div>" +
      '<div class="right" style="flex:none"><div class="mono" style="font-weight:500">' + UI.money(b.total) + "</div>" +
      '<div class="t-xs txt-3">total</div></div>' +
      "</div>"
    );
  }

  function priceLockCard() {
    return (
      '<div class="note note-jade"><span>' + UI.icon("lock", 18) + "</span><div>" +
      "<strong>Precio congelado en " + UI.money(b.total) + ".</strong> " +
      "Desde este momento y hasta que termines de pagar, este número no cambia. " +
      "Ni por demanda, ni por tiempo de espera, ni por el dispositivo desde el que compras.</div></div>"
    );
  }

  /* Paso previo: verificación anti-bot */
  function renderVerify() {
    root.innerHTML =
      '<div class="stack stack-5">' +
      contextCard() +
      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Antes de formarte</h2>' +
      '<span class="badge badge-violeta">Anti-bot</span></div>' +
      '<div class="panel-body stack stack-4">' +
      '<p class="txt-2 t-sm" style="margin:0">Los bots automatizados llegan a acaparar entre 15% y 30% del inventario ' +
      "en una preventa. Esta verificación tarda dos segundos y le quita el lugar a un programa, no a ti.</p>" +
      '<div class="card card-flat stack stack-3">' +
      '<label class="check"><input type="checkbox" id="v-human"> <span>Confirmo que soy una persona comprando para asistir al evento.</span></label>' +
      '<label class="check"><input type="checkbox" id="v-rules"> <span>Entiendo que el límite es de ' + BX.CONFIG.maxTicketsPerAccount +
      " boletos por cuenta y que revender fuera de Boletix cancela mi acceso.</span></label>" +
      "</div>" +
      '<div class="stack stack-2">' +
      '<div class="row between t-sm"><span class="txt-2">Boletos que ya tienes de este evento</span>' +
      '<strong class="mono">' + S.ticketsOwnedFor(user.id, ev.id) + " de " + BX.CONFIG.maxTicketsPerAccount + "</strong></div>" +
      '<div class="row between t-sm"><span class="txt-2">Cuenta verificada</span>' +
      '<strong>' + UI.esc(user.email) + "</strong></div>" +
      "</div>" +
      '<button class="btn btn-primary btn-lg btn-block" id="v-go" disabled>Entrar a la fila</button>' +
      "</div></div>" +
      '<a class="btn btn-plain btn-sm" href="evento.html?id=' + ev.id + '" style="align-self:center">' +
      UI.icon("left", 15) + "Volver al evento</a>" +
      "</div>";

    const h = document.getElementById("v-human"), r = document.getElementById("v-rules"), go = document.getElementById("v-go");
    function sync() { go.disabled = !(h.checked && r.checked); }
    h.addEventListener("change", sync);
    r.addEventListener("change", sync);
    go.addEventListener("click", function () {
      q = S.startQueue(ev.id);
      phase = "waiting";
      renderWaiting();
      start();
    });
    UI.hydratePosters(root);
  }

  /* Fila en curso */
  function renderWaiting() {
    const pct = Math.max(0, Math.min(100, Math.round((1 - q.position / q.initialPos) * 100)));
    const eta = Math.max(1, Math.round(q.position / q.rate));
    root.innerHTML =
      '<div class="stack stack-5">' +
      contextCard() +

      '<div class="panel"><div class="panel-body stack stack-5 center-txt">' +
      '<div class="stack stack-2">' +
      '<span class="eyebrow">Personas delante de ti</span>' +
      '<div class="queue-pos" id="q-pos">' + UI.numf(q.position) + "</div>" +
      '<span class="t-sm txt-2">Tiempo estimado: <strong id="q-eta">' + eta + " s</strong></span>" +
      "</div>" +
      '<div class="queue-meter"><i id="q-bar" style="width:' + pct + '%"></i></div>' +
      '<div class="row between t-xs txt-3"><span>Entraste en el lugar ' + UI.numf(q.initialPos) + "</span>" +
      '<span id="q-rate">Avanzando ' + q.rate + " personas/s</span></div>" +
      "</div></div>" +

      priceLockCard() +

      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Qué está pasando ahorita</h3></div>' +
      '<div class="panel-body stack stack-3 t-sm txt-2">' +
      "<div>· Tu lugar es real: sale de la cola de solicitudes del servidor, no de una animación.</div>" +
      "<div>· Si se te cae la conexión o cierras la pestaña, tu lugar sigue guardado. Vuelve a abrir esta página.</div>" +
      "<div>· Cuando sea tu turno tendrás " + BX.CONFIG.holdMinutes + " minutos con los lugares apartados. Si el pago falla, no vuelves a formarte.</div>" +
      "<div>· No liberamos boletos en tandas para crear urgencia artificial. Todo el inventario está a la venta desde el primer minuto.</div>" +
      "</div></div>" +

      '<button class="btn btn-plain btn-sm" id="q-leave" style="align-self:center">Salir de la fila</button>' +
      "</div>";

    document.getElementById("q-leave").addEventListener("click", function () {
      UI.confirm("Salir de la fila", "Pierdes tu lugar y el precio congelado. Tendrías que formarte otra vez.",
        "Salir de todos modos", function () {
          clearInterval(timer);
          S.clearQueue();
          location.href = "evento.html?id=" + ev.id;
        }, "btn-danger");
    });
    UI.hydratePosters(root);
  }

  function tickView() {
    const pos = document.getElementById("q-pos");
    if (!pos) return;
    pos.textContent = UI.numf(q.position);
    document.getElementById("q-eta").textContent = Math.max(0, Math.round(q.position / q.rate)) + " s";
    document.getElementById("q-bar").style.width =
      Math.max(0, Math.min(100, Math.round((1 - q.position / q.initialPos) * 100))) + "%";
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(function () {
      q = S.tickQueue();
      if (!q) { clearInterval(timer); return; }
      if (q.done) {
        clearInterval(timer);
        phase = "ready";
        S.setCart({
          eventId: ev.id, zoneId: zone.id, qty: qty,
          unitPrice: lockedPrice, seats: null,
        });
        renderReady();
      } else {
        tickView();
      }
    }, 550);
  }

  /* Turno listo */
  function renderReady() {
    const cart = S.cart();
    const nextStep = zone.seated ? "asientos.html" : "checkout.html";
    root.innerHTML =
      '<div class="stack stack-5">' +
      '<div class="panel" style="border-color:var(--jade)">' +
      '<div class="panel-body stack stack-4 center-txt">' +
      '<div style="color:var(--jade);display:flex;justify-content:center">' + UI.icon("check", 44) + "</div>" +
      "<div class=\"stack stack-2\"><h2>Es tu turno</h2>" +
      '<p class="txt-2 t-sm" style="margin:0">Tienes <strong id="hold-clock" class="countdown">' +
      UI.clock(cart.expiresAt - Date.now()) + "</strong> para completar la compra. " +
      "Durante ese tiempo tus lugares están apartados y nadie más puede tomarlos.</p></div>" +
      '<a class="btn btn-primary btn-lg btn-block" href="' + nextStep + '">' +
      (zone.seated ? "Elegir mis asientos" : "Ir al pago") + "</a>" +
      "</div></div>" +
      contextCard() +
      priceLockCard() +
      "</div>";

    const clock = document.getElementById("hold-clock");
    const holdTimer = setInterval(function () {
      const c = S.cart();
      if (!c) {
        clearInterval(holdTimer);
        UI.toast("Se agotó el tiempo. Tus lugares volvieron al inventario.", "err");
        setTimeout(() => (location.href = "evento.html?id=" + ev.id), 900);
        return;
      }
      const left = c.expiresAt - Date.now();
      clock.textContent = UI.clock(left);
      clock.classList.toggle("is-low", left < 120000);
    }, 1000);
    UI.hydratePosters(root);
  }

  /* ---------- Arranque: retomar fila si existía ---------- */
  const existing = S.queue();
  if (existing && existing.eventId === ev.id && !existing.done) {
    q = existing;
    phase = "waiting";
    renderWaiting();
    start();
  } else if (S.cart()) {
    phase = "ready";
    renderReady();
  } else {
    renderVerify();
  }
})();
