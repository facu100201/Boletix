/* BOLETIX — Hub del usuario */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["fan"]);
  if (!user) return;

  const SECTIONS = [
    { id: "boletos", label: "Mis boletos", icon: "ticket" },
    { id: "ordenes", label: "Mis compras", icon: "doc" },
    { id: "reventa", label: "En reventa", icon: "swap" },
    { id: "reembolsos", label: "Reembolsos", icon: "back" },
    { id: "alertas", label: "Alertas y seguidos", icon: "bell" },
    { id: "pagos", label: "Métodos de pago", icon: "card" },
    { id: "perfil", label: "Mi perfil", icon: "user" },
  ];
  let current = (location.hash || "#boletos").slice(1);
  if (!SECTIONS.some((s) => s.id === current)) current = "boletos";

  const view = document.getElementById("ac-view");

  /* ---------- Encabezado ---------- */
  function renderHead() {
    const orders = S.orders(user.id);
    const active = orders.filter((o) => o.status === "pagada" && !S.event(o.eventId).past);
    const tickets = active.reduce((s, o) => s + o.qty, 0);
    const spent = orders.filter((o) => o.status !== "reembolsada").reduce((s, o) => s + o.total, 0);
    const saved = orders.filter((o) => o.status !== "reembolsada")
      .reduce((s, o) => s + BX.breakdown(o.unitPrice, o.qty).savings, 0);

    document.getElementById("ac-head").innerHTML =
      '<div class="stack stack-4">' +
      '<div class="row" style="gap:var(--s3)">' +
      '<span class="avatar avatar-lg">' + user.name.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase() + "</span>" +
      '<div class="stack stack-1 grow" style="min-width:0">' +
      '<span class="eyebrow">Mi cuenta</span>' +
      '<h1 style="font-size:var(--t-xl)">' + UI.esc(user.name) + "</h1>" +
      '<span class="t-sm txt-2">' + UI.esc(user.email) + " · desde " + UI.dateShort(user.createdAt) + "</span>" +
      "</div></div>" +
      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      stat("Boletos vigentes", UI.numf(tickets), active.length + (active.length === 1 ? " evento" : " eventos")) +
      stat("Total comprado", UI.money(spent), orders.length + " órdenes") +
      stat("Ahorro acumulado", UI.money(saved), "vs. cargo del 20%") +
      stat("Reembolsos", String(S.refundsOf(user.id).length), "todos procesados a tiempo") +
      "</div></div>";
  }
  function stat(label, value, sub) {
    return '<div class="card card-flat" style="padding:var(--s3)">' +
      '<div class="stat-value" style="font-size:var(--t-lg)">' + value + "</div>" +
      '<div class="t-sm" style="font-weight:600">' + label + "</div>" +
      '<div class="t-xs txt-3">' + sub + "</div></div>";
  }

  /* ---------- Menú lateral ---------- */
  function renderSide() {
    document.getElementById("ac-side").innerHTML = SECTIONS.map(function (s) {
      return '<button class="side-item' + (s.id === current ? " is-active" : "") + '" data-go="' + s.id + '">' +
        UI.icon(s.icon, 18) + s.label + "</button>";
    }).join("");
  }
  document.getElementById("ac-side").addEventListener("click", function (e) {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    current = b.dataset.go;
    history.replaceState(null, "", "#" + current);
    renderSide(); render();
  });

  /* ================= SECCIONES ================= */

  function boletos() {
    const orders = S.orders(user.id).filter(function (o) {
      const ev = S.event(o.eventId);
      return ev && !ev.past && (o.status === "pagada" || o.status === "en reventa");
    }).sort((a, b) => new Date(S.event(a.eventId).date) - new Date(S.event(b.eventId).date));

    if (!orders.length) {
      return empty("ticket", "Todavía no tienes boletos",
        "Cuando compres algo va a aparecer aquí, con su código listo para la puerta.",
        '<a class="btn btn-primary" href="eventos.html">Ver la cartelera</a>');
    }

    return '<div class="stack stack-4">' +
      '<div class="row between"><h2 style="font-size:var(--t-lg)">Próximos eventos</h2>' +
      '<span class="badge">' + orders.length + "</span></div>" +
      orders.map(function (o) {
        const ev = S.event(o.eventId);
        const z = S.zone(ev, o.zoneId);
        const venue = S.venue(ev.venueId);
        const soon = (new Date(ev.date) - Date.now()) < 72 * 3600000;
        return (
          '<article class="stub">' +
          '<div style="padding:var(--s4)"><div class="row" style="gap:var(--s3);align-items:flex-start">' +
          '<div style="width:72px;flex:none">' + UI.posterHTML(ev, {}) + "</div>" +
          '<div class="stack stack-1 grow" style="min-width:0">' +
          '<div class="row row-wrap" style="gap:6px">' +
          '<span class="badge ' + (soon ? "badge-ambar" : "") + '">' + UI.relative(ev.date) + "</span>" +
          (o.status === "en reventa" ? '<span class="badge badge-violeta">Publicado en reventa</span>' : "") +
          "</div>" +
          '<strong style="font-size:var(--t-md);line-height:1.2">' + UI.esc(ev.title) + "</strong>" +
          '<span class="t-sm txt-2">' + UI.dateLong(ev.date) + " · " + UI.time(ev.date) + " h</span>" +
          '<span class="t-sm txt-2">' + UI.esc(venue.name) + " · " + UI.esc(z.name) + "</span>" +
          "</div></div></div>" +

          '<div class="stub-perf"></div>' +

          '<div style="padding:var(--s4)" class="stack stack-3">' +
          '<div class="stack stack-2">' +
          o.tickets.map(function (t, i) {
            const dead = t.status === "cancelada";
            const used = t.status === "usada";
            const moved = t.status === "transferida";
            return '<a class="card card-flat row between" href="boleto.html?t=' + t.id + '" style="gap:var(--s3);opacity:' + (dead ? ".5" : "1") + '">' +
              '<div class="row" style="gap:var(--s3);min-width:0">' +
              '<span style="color:var(--accent);flex:none">' + UI.icon("qr", 20) + "</span>" +
              '<div class="stack stack-1" style="min-width:0"><strong class="t-sm">Boleto ' + (i + 1) +
              (t.seat ? " · Asiento " + t.seat : "") + "</strong>" +
              '<span class="mono t-xs txt-3">' + t.code + "</span></div></div>" +
              '<span class="badge ' + (used ? "badge-jade" : moved ? "badge-violeta" : dead ? "badge-rojo" : "") + '">' +
              (used ? "Usado" : moved ? "Transferido" : dead ? "Cancelado" : "Vigente") + "</span></a>";
          }).join("") +
          "</div>" +
          '<div class="row row-wrap" style="gap:var(--s2)">' +
          '<a class="btn btn-primary btn-sm" href="boleto.html?t=' + o.tickets[0].id + '">Abrir mi código</a>' +
          '<button class="btn btn-ghost btn-sm" data-transfer="' + o.id + '">' + UI.icon("share", 15) + "Transferir</button>" +
          (o.status === "pagada"
            ? '<button class="btn btn-ghost btn-sm" data-resell="' + o.id + '">' + UI.icon("swap", 15) + "Revender</button>" +
              '<button class="btn btn-ghost btn-sm" data-refund="' + o.id + '">' + UI.icon("back", 15) + "Reembolsar</button>"
            : '<button class="btn btn-ghost btn-sm" data-unlist="' + o.id + '">Quitar de reventa</button>') +
          "</div></div></article>"
        );
      }).join("") + "</div>";
  }

  function ordenes() {
    const orders = S.orders(user.id);
    if (!orders.length) return empty("doc", "Sin compras todavía", "Aquí queda el registro de todo lo que compres.", "");
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Historial de compras</h2>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Orden</th><th>Evento</th><th>Fecha de compra</th><th>Boletos</th><th class=\"right\">Total</th><th>Estado</th>" +
      "</tr></thead><tbody>" +
      orders.map(function (o) {
        const ev = S.event(o.eventId);
        const badge = { pagada: "badge-jade", usada: "", reembolsada: "badge-rojo", "en reventa": "badge-violeta" }[o.status] || "";
        return "<tr>" +
          '<td class="mono t-xs">' + o.id + "</td>" +
          "<td><strong>" + UI.esc(ev.title) + "</strong><br><span class=\"t-xs txt-3\">" + UI.dateShort(ev.date) + "</span></td>" +
          '<td class="t-xs">' + o.createdAt.replace("T", " · ") + "</td>" +
          '<td class="num">' + o.qty + "</td>" +
          '<td class="right mono">' + UI.money2(o.total) + "</td>" +
          '<td><span class="badge ' + badge + '">' + o.status + "</span></td>" +
          "</tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<p class="t-xs txt-3">Todas las cifras incluyen el cargo por servicio y el IVA. No hay conceptos adicionales.</p>' +
      "</div>";
  }

  function reventa() {
    const mine = S.resale().filter((r) => r.sellerId === user.id);
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Mis boletos en reventa</h2>' +
      '<div class="note note-jade"><span>' + UI.icon("lock", 18) + "</span><div class=\"t-sm\">" +
      "<strong>Tope duro al precio original.</strong> Boletix no permite publicar un boleto por encima de lo que costó. " +
      "Cuando alguien lo compra, tu código muere y el comprador recibe uno nuevo.</div></div>" +
      (mine.length
        ? mine.map(function (r) {
            const ev = S.event(r.eventId);
            const z = S.zone(ev, r.zoneId);
            return '<div class="card row between" style="gap:var(--s3)">' +
              '<div class="stack stack-1 grow" style="min-width:0">' +
              "<strong>" + UI.esc(ev.title) + "</strong>" +
              '<span class="t-sm txt-2">' + UI.esc(z.name) + " · " + r.qty + " boletos · publicado " + UI.relative(r.listedAt) + "</span>" +
              '<span class="t-xs txt-3">Motivo: ' + UI.esc(r.reason) + "</span></div>" +
              '<div class="right stack stack-2" style="flex:none">' +
              '<span class="mono" style="font-weight:500">' + UI.money(BX.ptr(r.price)) + "</span>" +
              '<button class="btn btn-ghost btn-sm" data-unlist-listing="' + r.id + '">Retirar</button>' +
              "</div></div>";
          }).join("")
        : empty("swap", "No tienes nada publicado",
            "Si te sale un imprevisto, publica tu boleto desde la sección Mis boletos y recupera lo que pagaste.", "")) +
      "</div>";
  }

  function reembolsos() {
    const list = S.refundsOf(user.id).slice().reverse();
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Reembolsos</h2>' +
      '<div class="note note-jade"><span>' + UI.icon("clock", 18) + "</span><div class=\"t-sm\">" +
      "<strong>Compromiso de " + BX.CONFIG.refundSlaHours + " horas.</strong> " +
      "El promedio del sector son 21 días naturales. Aquí el reloj corre a la vista y devolvemos también la comisión de servicio.</div></div>" +
      (list.length
        ? list.map(function (r) {
            const done = r.status === "completado";
            const src = S.order(r.orderId);
            const amount = r.amount || (src ? src.total : 0);
            const left = r.dueAt ? Math.max(0, new Date(r.dueAt) - Date.now()) : 0;
            const pct = r.dueAt
              ? Math.min(100, Math.round((1 - left / (BX.CONFIG.refundSlaHours * 3600000)) * 100))
              : 100;
            return '<div class="card stack stack-3">' +
              '<div class="row between"><div class="stack stack-1">' +
              '<span class="mono t-xs txt-3">' + r.id + " · orden " + r.orderId + "</span>" +
              "<strong>" + UI.money2(amount) + " en devolución</strong>" +
              '<span class="t-sm txt-2">' + UI.esc(r.reason) + "</span></div>" +
              '<span class="badge ' + (done ? "badge-jade" : "badge-ambar") + '">' + r.status + "</span></div>" +
              '<div class="bar-track"><i style="width:' + pct + "%;background:" + (done ? "var(--jade)" : "var(--ambar)") + '"></i></div>' +
              '<span class="t-xs txt-3">' +
              (done ? "Depositado el " + UI.dateShort(r.closedAt || r.openedAt)
                    : "El banco lo refleja " + UI.relative(r.dueAt) + ". Solicitado " + UI.relative(r.openedAt) + ".") +
              "</span></div>";
          }).join("")
        : empty("back", "Nunca has pedido un reembolso",
            "Si algún día lo necesitas, es un botón en tu boleto. Sin llamadas ni formularios.", "")) +
      "</div>";
  }

  function alertas() {
    const watched = S.upcoming().filter((e) => S.isWatching(e.id));
    return '<div class="stack stack-5">' +
      '<div class="stack stack-3"><h2 style="font-size:var(--t-lg)">Eventos que sigo</h2>' +
      (watched.length
        ? '<div class="grid g-2 g-md-3">' + watched.map(UI.eventCard).join("") + "</div>"
        : '<p class="txt-2 t-sm">No sigues ningún evento. Usa el botón <em>Avisarme de cambios</em> en cualquier evento para enterarte si se liberan lugares.</p>') +
      "</div>" +

      '<div class="stack stack-3"><h2 style="font-size:var(--t-lg)">Artistas que sigo</h2>' +
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      (user.follows.length
        ? user.follows.map((f) => '<a class="chip is-on" href="eventos.html?q=' + encodeURIComponent(f) + '">' + UI.esc(f) + "</a>").join("")
        : '<span class="txt-3 t-sm">Todavía ninguno.</span>') +
      "</div></div>" +

      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Cómo te avisamos</h3></div>' +
      '<div class="panel-body stack stack-3">' +
      '<label class="check"><input type="checkbox" id="pf-alerts"' + (user.prefs.alerts ? " checked" : "") +
      "> <span>Avisos de preventa y cambios en eventos que sigo</span></label>" +
      '<label class="check"><input type="checkbox" id="pf-news"' + (user.prefs.newsletter ? " checked" : "") +
      "> <span>Boletín semanal de la cartelera</span></label>" +
      '<p class="t-xs txt-3" style="margin:0">Nunca te escribimos por otra razón. Sin promociones de terceros, sin correos de "te extrañamos".</p>' +
      '<button class="btn btn-ghost btn-sm" id="pf-save-alerts" style="align-self:flex-start">Guardar preferencias</button>' +
      "</div></div></div>";
  }

  function pagos() {
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Métodos de pago</h2>' +
      (user.cards.length
        ? user.cards.map(function (c) {
            return '<div class="card row between" style="gap:var(--s3)">' +
              '<div class="row" style="gap:var(--s3)"><span class="txt-3">' + UI.icon("card", 24) + "</span>" +
              '<div class="stack stack-1"><strong>' + c.brand + " ••" + c.last4 + "</strong>" +
              '<span class="t-xs txt-3">Vence ' + c.exp + " · " + UI.esc(c.holder) + "</span></div></div>" +
              '<button class="btn btn-ghost btn-sm" data-delcard="' + c.id + '">' + UI.icon("trash", 15) + "</button>" +
              "</div>";
          }).join("")
        : empty("card", "Sin tarjetas guardadas", "Puedes guardar una al momento de pagar, o pagar con SPEI y efectivo sin guardar nada.", "")) +
      '<div class="note"><span>' + UI.icon("shield", 18) + "</span><div class=\"t-sm\">" +
      "Nunca guardamos el código de seguridad. Se pide en cada compra y se descarta al terminar.</div></div>" +
      "</div>";
  }

  function perfil() {
    return '<div class="stack stack-5">' +
      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Mis datos</h2></div>' +
      '<div class="panel-body stack stack-4">' +
      '<div class="grid g-md-2" style="gap:var(--s3)">' +
      '<div class="field"><label class="label" for="pf-name">Nombre completo</label>' +
      '<input class="input" id="pf-name" value="' + UI.esc(user.name) + '"></div>' +
      '<div class="field"><label class="label" for="pf-mail">Correo</label>' +
      '<input class="input" id="pf-mail" type="email" value="' + UI.esc(user.email) + '"></div>' +
      '<div class="field"><label class="label" for="pf-phone">Teléfono</label>' +
      '<input class="input" id="pf-phone" value="' + UI.esc(user.phone || "") + '"></div>' +
      '<div class="field"><label class="label" for="pf-birth">Fecha de nacimiento</label>' +
      '<input class="input" id="pf-birth" type="date" value="' + UI.esc(user.birth || "") + '"></div>' +
      "</div>" +
      '<label class="check"><input type="checkbox" id="pf-acc"' + (user.prefs.accessibility ? " checked" : "") +
      "> <span>Mostrarme primero las zonas accesibles para silla de ruedas</span></label>" +
      '<button class="btn btn-primary" id="pf-save" style="align-self:flex-start">Guardar cambios</button>' +
      "</div></div>" +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Seguridad</h2></div>' +
      '<div class="panel-body stack stack-3">' +
      '<div class="row between"><div><strong class="t-sm">Contraseña</strong><br>' +
      '<span class="t-xs txt-3">Última vez cambiada al crear la cuenta</span></div>' +
      '<button class="btn btn-ghost btn-sm" id="pf-pass">Cambiar</button></div>' +
      '<hr class="divider">' +
      '<div class="row between"><div><strong class="t-sm">Sesiones activas</strong><br>' +
      '<span class="t-xs txt-3">Este navegador · Ciudad de México</span></div>' +
      '<button class="btn btn-ghost btn-sm" id="pf-sessions">Cerrar otras</button></div>' +
      "</div></div>" +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Tus datos son tuyos</h2></div>' +
      '<div class="panel-body stack stack-3">' +
      '<p class="t-sm txt-2" style="margin:0">Puedes llevarte todo lo que tenemos de ti, en cualquier momento, sin pedirlo por correo ni esperar respuesta.</p>' +
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      '<button class="btn btn-ghost btn-sm" id="pf-export">' + UI.icon("doc", 15) + "Descargar mis datos</button>" +
      '<button class="btn btn-danger btn-sm" id="pf-delete">' + UI.icon("trash", 15) + "Eliminar mi cuenta</button>" +
      "</div></div></div></div>";
  }

  function empty(icon, title, text, action) {
    return '<div class="empty"><div class="empty-mark">' + UI.icon(icon, 24) + "</div>" +
      "<h3>" + title + "</h3><p class=\"txt-2 t-sm\" style=\"max-width:44ch\">" + text + "</p>" + (action || "") + "</div>";
  }

  /* ================= ACCIONES ================= */
  /* La delegación se registra una sola vez; bind() sólo conecta
     los controles que se recrean en cada render. */
  view.addEventListener("click", function (e) {
      const t = e.target.closest("[data-transfer],[data-resell],[data-refund],[data-unlist],[data-unlist-listing],[data-delcard]");
      if (!t) return;

      if (t.dataset.transfer) return doTransfer(t.dataset.transfer);
      if (t.dataset.resell) return doResell(t.dataset.resell);
      if (t.dataset.refund) return doRefund(t.dataset.refund);
      if (t.dataset.unlist) {
        const l = S.resale().find((r) => r.orderId === t.dataset.unlist);
        if (l) { S.cancelListing(l.id); UI.toast("Boleto retirado de reventa.", "ok"); refresh(); }
        return;
      }
      if (t.dataset.unlistListing) {
        S.cancelListing(t.dataset.unlistListing);
        UI.toast("Publicación retirada.", "ok");
        refresh();
        return;
      }
      if (t.dataset.delcard) {
        UI.confirm("Eliminar tarjeta", "Se borra de tu cuenta. Podrás volver a guardarla en tu próxima compra.",
          "Eliminar", function () {
            user.cards = user.cards.filter((c) => c.id !== t.dataset.delcard);
            S.updateUser({ cards: user.cards });
            UI.toast("Tarjeta eliminada.", "ok");
            refresh();
          }, "btn-danger");
      }
  });

  function bind() {
    const saveAlerts = document.getElementById("pf-save-alerts");
    if (saveAlerts) saveAlerts.addEventListener("click", function () {
      S.updateUser({
        prefs: Object.assign({}, user.prefs, {
          alerts: document.getElementById("pf-alerts").checked,
          newsletter: document.getElementById("pf-news").checked,
        }),
      });
      UI.toast("Preferencias guardadas.", "ok");
    });

    const save = document.getElementById("pf-save");
    if (save) save.addEventListener("click", function () {
      const name = document.getElementById("pf-name").value.trim();
      const mail = document.getElementById("pf-mail").value.trim();
      if (name.split(/\s+/).length < 2) return UI.toast("Escribe nombre y apellido.", "err");
      if (!/^\S+@\S+\.\S+$/.test(mail)) return UI.toast("Ese correo no es válido.", "err");
      S.updateUser({
        name: name, email: mail,
        phone: document.getElementById("pf-phone").value.trim(),
        birth: document.getElementById("pf-birth").value,
        prefs: Object.assign({}, user.prefs, { accessibility: document.getElementById("pf-acc").checked }),
      });
      UI.toast("Datos actualizados.", "ok");
      renderHead();
    });

    const pass = document.getElementById("pf-pass");
    if (pass) pass.addEventListener("click", function () {
      UI.modal({
        title: "Cambiar contraseña",
        body: '<div class="stack stack-3">' +
          '<div class="field"><label class="label" for="p0">Contraseña actual</label><input class="input" type="password" id="p0"></div>' +
          '<div class="field"><label class="label" for="p1">Nueva contraseña</label><input class="input" type="password" id="p1"></div>' +
          '<div class="field"><label class="label" for="p2">Repítela</label><input class="input" type="password" id="p2"></div></div>',
        actions: [
          { label: "Cancelar", variant: "btn-ghost" },
          {
            label: "Cambiar", variant: "btn-primary", onClick: function (body) {
              if (body.querySelector("#p0").value !== user.password) { UI.toast("La contraseña actual no coincide.", "err"); return false; }
              const n = body.querySelector("#p1").value;
              if (n.length < 8) { UI.toast("La nueva necesita al menos 8 caracteres.", "err"); return false; }
              if (n !== body.querySelector("#p2").value) { UI.toast("Las nuevas no coinciden.", "err"); return false; }
              S.updateUser({ password: n });
              UI.toast("Contraseña actualizada.", "ok");
            }
          },
        ],
      });
    });

    const sess = document.getElementById("pf-sessions");
    if (sess) sess.addEventListener("click", () => UI.toast("No hay otras sesiones abiertas.", "ok"));

    const exp = document.getElementById("pf-export");
    if (exp) exp.addEventListener("click", function () {
      const data = {
        perfil: { nombre: user.name, correo: user.email, telefono: user.phone, nacimiento: user.birth, alta: user.createdAt },
        preferencias: user.prefs,
        artistas_seguidos: user.follows,
        ordenes: S.orders(user.id),
        reembolsos: S.refundsOf(user.id),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mis-datos-boletix.json";
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
      UI.toast("Archivo descargado.", "ok");
    });

    const del = document.getElementById("pf-delete");
    if (del) del.addEventListener("click", function () {
      UI.confirm("Eliminar cuenta",
        "Se borran tu perfil y tu historial. Los boletos vigentes se reembolsan automáticamente. Esto no se puede deshacer.",
        "Eliminar definitivamente",
        function () { UI.toast("En el prototipo esta acción no borra los datos de demostración.", "err"); },
        "btn-danger");
    });
  }

  function doTransfer(orderId) {
    const o = S.order(orderId);
    const options = o.tickets.filter((t) => t.status === "valida");
    if (!options.length) return UI.toast("No hay boletos vigentes que transferir en esta orden.", "err");
    UI.modal({
      title: "Transferir un boleto",
      body:
        '<div class="stack stack-4">' +
        '<div class="note note-jade"><span>' + UI.icon("shield", 18) + "</span><div class=\"t-sm\">" +
        "Al transferir, tu código deja de servir en ese instante y la persona recibe uno nuevo. " +
        "Nadie puede entrar dos veces con el mismo boleto.</div></div>" +
        '<div class="field"><label class="label" for="tr-ticket">Boleto</label><select class="select" id="tr-ticket">' +
        options.map((t, i) => '<option value="' + t.id + '">Boleto ' + (i + 1) + (t.seat ? " · " + t.seat : "") + " · " + t.code + "</option>").join("") +
        "</select></div>" +
        '<div class="field"><label class="label" for="tr-name">Nombre de quien lo recibe</label><input class="input" id="tr-name" placeholder="Nombre y apellido"></div>' +
        '<div class="field"><label class="label" for="tr-mail">Su correo</label><input class="input" type="email" id="tr-mail" placeholder="persona@correo.com"></div>' +
        "</div>",
      actions: [
        { label: "Cancelar", variant: "btn-ghost" },
        {
          label: "Transferir", variant: "btn-primary", onClick: function (body) {
            const name = body.querySelector("#tr-name").value.trim();
            const mail = body.querySelector("#tr-mail").value.trim();
            if (name.split(/\s+/).length < 2) { UI.toast("Escribe nombre y apellido.", "err"); return false; }
            if (!/^\S+@\S+\.\S+$/.test(mail)) { UI.toast("Ese correo no es válido.", "err"); return false; }
            const r = S.transfer(orderId, body.querySelector("#tr-ticket").value, mail, name);
            if (!r.ok) { UI.toast(r.error, "err"); return false; }
            UI.toast("Boleto transferido a " + name + ". Su código nuevo ya está activo.", "ok");
            refresh();
          }
        },
      ],
    });
  }

  function doResell(orderId) {
    const o = S.order(orderId);
    const ev = S.event(o.eventId);
    UI.modal({
      title: "Publicar en Reventa Justa",
      body:
        '<div class="stack stack-4">' +
        "<div class=\"card card-flat stack stack-2\">" +
        "<strong>" + UI.esc(ev.title) + "</strong>" +
        '<div class="row between t-sm"><span class="txt-2">Precio al que lo compraste</span><strong class="mono">' + UI.money(o.unitPrice) + "</strong></div>" +
        '<div class="row between t-sm"><span class="txt-2">Precio de publicación</span><strong class="mono">' + UI.money(o.unitPrice) + "</strong></div>" +
        '<div class="row between t-sm"><span class="txt-2">Recibes por boleto</span><strong class="mono" style="color:var(--jade)">' + UI.money(o.unitPrice) + "</strong></div>" +
        "</div>" +
        '<div class="note note-jade"><span>' + UI.icon("lock", 18) + "</span><div class=\"t-sm\">" +
        "El precio está fijado al original y no se puede editar. Boletix no te cobra comisión por revender: " +
        "recuperas exactamente lo que pagaste por el boleto.</div></div>" +
        '<div class="field"><label class="label" for="rs-qty">Cuántos publicas</label><select class="select" id="rs-qty">' +
        Array.from({ length: o.qty }, (_, i) => "<option>" + (i + 1) + "</option>").join("") + "</select></div>" +
        '<div class="field"><label class="label" for="rs-reason">Motivo (lo ve el comprador)</label>' +
        '<select class="select" id="rs-reason">' +
        ["Cambio de planes", "Ya no puedo asistir", "Compré duplicado", "Se canceló mi viaje", "Motivos de salud"]
          .map((r) => "<option>" + r + "</option>").join("") + "</select></div>" +
        "</div>",
      actions: [
        { label: "Cancelar", variant: "btn-ghost" },
        {
          label: "Publicar", variant: "btn-primary", onClick: function (body) {
            const r = S.listForResale(orderId, Number(body.querySelector("#rs-qty").value), body.querySelector("#rs-reason").value);
            if (!r.ok) { UI.toast(r.error, "err"); return false; }
            UI.toast("Publicado al precio original. Te avisamos en cuanto se venda.", "ok");
            refresh();
          }
        },
      ],
    });
  }

  function doRefund(orderId) {
    const o = S.order(orderId);
    const ev = S.event(o.eventId);
    const chk = S.canRefund(o);
    if (!chk.ok) return UI.toast(chk.why, "err");

    UI.modal({
      title: "Reembolsar esta compra",
      body:
        '<div class="stack stack-4">' +
        "<div class=\"card card-flat stack stack-2\">" +
        "<strong>" + UI.esc(ev.title) + "</strong>" +
        '<div class="row between t-sm"><span class="txt-2">Boletos</span><strong>' + UI.money2(o.subtotal) + "</strong></div>" +
        '<div class="row between t-sm"><span class="txt-2">Cargo por servicio</span><strong>' + UI.money2(o.fee + o.iva) + "</strong></div>" +
        '<div class="price-total"><span style="font-weight:700">Te devolvemos</span><span class="amount">' + UI.money2(o.total) + "</span></div>" +
        "</div>" +
        '<div class="note note-jade"><span>' + UI.icon("check", 18) + "</span><div class=\"t-sm\">" +
        "Devolvemos <strong>todo</strong>, incluida nuestra comisión. La mayoría de las boleteras se queda con el cargo por servicio; " +
        "nosotros no. El dinero llega a tu método de pago en un máximo de " + BX.CONFIG.refundSlaHours + " horas.</div></div>" +
        '<div class="field"><label class="label" for="rf-reason">¿Qué pasó? Nos ayuda a mejorar</label>' +
        '<select class="select" id="rf-reason">' +
        ["Ya no puedo asistir", "Compré por error", "Cambió la fecha del evento", "Problema de salud", "Prefiero no decir"]
          .map((r) => "<option>" + r + "</option>").join("") + "</select></div>" +
        "</div>",
      actions: [
        { label: "Mejor no", variant: "btn-ghost" },
        {
          label: "Confirmar reembolso", variant: "btn-primary", onClick: function (body) {
            const r = S.refund(orderId, body.querySelector("#rf-reason").value);
            if (!r.ok) { UI.toast(r.error, "err"); return false; }
            UI.toast("Reembolso en proceso. Sigue el reloj en la sección Reembolsos.", "ok");
            current = "reembolsos";
            history.replaceState(null, "", "#reembolsos");
            renderSide(); refresh();
          }
        },
      ],
    });
  }

  /* ================= Render ================= */
  function render() {
    const map = { boletos, ordenes, reventa, reembolsos, alertas, pagos, perfil };
    view.innerHTML = (map[current] || boletos)();
    BX.app.fillIconSlots(view);
    UI.hydratePosters(view);
    bind();
  }
  function refresh() { renderHead(); render(); }

  window.addEventListener("hashchange", function () {
    const h = location.hash.slice(1);
    if (SECTIONS.some((s) => s.id === h)) { current = h; renderSide(); render(); }
  });

  renderHead();
  renderSide();
  render();
})();
