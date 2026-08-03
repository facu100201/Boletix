/* BOLETIX — Panel de administración del sitio */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["admin"]);
  if (!user) return;

  const SECTIONS = [
    { id: "resumen", label: "Resumen", icon: "chart" },
    { id: "aprobaciones", label: "Aprobaciones", icon: "check" },
    { id: "eventos", label: "Eventos", icon: "calendar" },
    { id: "promotores", label: "Promotores", icon: "building" },
    { id: "usuarios", label: "Usuarios", icon: "users" },
    { id: "ordenes", label: "Órdenes y reembolsos", icon: "money" },
    { id: "seguridad", label: "Seguridad", icon: "shield" },
    { id: "reglas", label: "Reglas de la plataforma", icon: "settings" },
  ];
  let current = (location.hash || "#resumen").slice(1);
  if (!SECTIONS.some((s) => s.id === current)) current = "resumen";

  const view = document.getElementById("ad-view");

  /* ---------- Encabezado ---------- */
  function renderHead() {
    const st = S.platformStats();
    document.getElementById("ad-head").innerHTML =
      '<div class="stack stack-4">' +
      '<div class="row between row-wrap" style="gap:var(--s3)">' +
      '<div class="stack stack-1">' +
      '<span class="eyebrow">Administración de plataforma</span>' +
      '<h1 style="font-size:var(--t-xl)">Centro de control Boletix</h1>' +
      '<span class="t-sm txt-2">' + UI.esc(user.name) + " · Ciudad de México · " + UI.dateLong(new Date()) + "</span>" +
      "</div>" +
      '<div class="row" style="gap:var(--s2)">' +
      '<a class="btn btn-ghost btn-sm" href="escaner.html">' + UI.icon("scan", 16) + "App de puerta</a>" +
      '<button class="btn btn-ghost btn-sm" onclick="BX.app.resetDemo()">Reiniciar demo</button>' +
      "</div></div>" +

      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      kpi("Transaccionado", UI.compact(st.gross), UI.numf(st.tickets) + " boletos emitidos", "up", "+18%") +
      kpi("Ingreso Boletix", UI.compact(st.fee), "comisión de 7%", "up", "+18%") +
      kpi("Eventos en venta", UI.numf(st.liveEvents), st.avgFill + "% de ocupación media", null, "") +
      kpi("Requieren atención", UI.numf(st.pending + st.openIncidents), st.pending + " por aprobar · " + st.openIncidents + " incidencias", st.openIncidents ? "down" : null, "") +
      "</div></div>";
  }
  function kpi(label, value, sub, dir, delta) {
    return '<div class="stat">' +
      '<div class="stat-label">' + label + "</div>" +
      '<div class="stat-value">' + value + "</div>" +
      '<div class="row between"><span class="t-xs txt-3">' + sub + "</span>" +
      (delta ? '<span class="stat-delta ' + (dir === "up" ? "delta-up" : "delta-down") + '">' + delta + "</span>" : "") +
      "</div></div>";
  }

  /* ---------- Menú ---------- */
  function renderSide() {
    const st = S.platformStats();
    const badges = { aprobaciones: st.pending, seguridad: st.openIncidents, ordenes: st.refundsOpen };
    document.getElementById("ad-side").innerHTML = SECTIONS.map(function (s) {
      const n = badges[s.id];
      return '<button class="side-item' + (s.id === current ? " is-active" : "") + '" data-go="' + s.id + '">' +
        UI.icon(s.icon, 18) + '<span class="grow">' + s.label + "</span>" +
        (n ? '<span class="badge badge-rosa">' + n + "</span>" : "") + "</button>";
    }).join("");
  }
  document.getElementById("ad-side").addEventListener("click", function (e) {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    current = b.dataset.go;
    history.replaceState(null, "", "#" + current);
    renderSide(); render();
  });

  /* ================= SECCIONES ================= */

  function resumen() {
    const st = S.platformStats();
    const top = S.events().filter((e) => !e.past)
      .map((e) => ({ e: e, r: S.revenueOfEvent(e.id) }))
      .sort((a, b) => b.r.gross - a.r.gross).slice(0, 6);

    return '<div class="stack stack-5">' +

      '<div class="grid g-md-2" style="gap:var(--s4)">' +
      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Ingreso mensual de la plataforma</h2></div>' +
      '<div class="panel-body"><div id="ad-chart"></div></div></div>' +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Salud del sistema</h2>' +
      '<span class="badge badge-jade">Operando</span></div>' +
      '<div class="panel-body stack stack-4">' +
      [["Disponibilidad (30 días)", "99.97%", 99.97, "var(--jade)"],
       ["Latencia media de compra", "310 ms", 82, "var(--jade)"],
       ["Capacidad de fila usada", "34%", 34, "var(--ambar)"],
       ["Bots bloqueados hoy", "1,284", 68, "var(--violeta)"]].map(function (m) {
        return '<div class="stack stack-1">' +
          '<div class="row between t-sm"><span class="txt-2">' + m[0] + '</span><strong class="mono">' + m[1] + "</strong></div>" +
          '<div class="bar-track"><i style="width:' + m[2] + "%;background:" + m[3] + '"></i></div></div>';
      }).join("") +
      '<p class="t-xs txt-3" style="margin:0">Escalado automático programado para viernes a domingo y días 15 y 30, ' +
      "donde se concentra el 65% de la venta.</p>" +
      "</div></div></div>" +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Eventos con mayor venta</h2></div>' +
      '<div class="panel-body"><div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Evento</th><th>Promotor</th><th class=\"right\">Ocupación</th><th class=\"right\">Bruto</th><th class=\"right\">Comisión</th>" +
      "</tr></thead><tbody>" +
      top.map(function (x) {
        const pct = Math.round((x.e.sold / x.e.capacity) * 100);
        return "<tr><td><strong>" + UI.esc(x.e.title) + "</strong><br><span class=\"t-xs txt-3\">" + UI.dateShort(x.e.date) + "</span></td>" +
          "<td class=\"t-xs\">" + UI.esc(S.promoter(x.e.promoterId).name) + "</td>" +
          '<td class="right mono">' + pct + "%</td>" +
          '<td class="right mono">' + UI.compact(x.r.gross) + "</td>" +
          '<td class="right mono" style="color:var(--jade)">' + UI.compact(x.r.fee) + "</td></tr>";
      }).join("") +
      "</tbody></table></div></div></div>" +

      (st.pending || st.openIncidents
        ? '<div class="note note-ambar"><span>' + UI.icon("alert", 18) + "</span><div class=\"t-sm\">" +
          "<strong>Tienes " + (st.pending + st.openIncidents) + " asuntos abiertos.</strong> " +
          st.pending + " eventos esperan aprobación y " + st.openIncidents + " incidencias de seguridad siguen sin cerrar.</div></div>"
        : "") +
      "</div>";
  }

  function aprobaciones() {
    const list = S.pending();
    if (!list.length) {
      return '<div class="empty"><div class="empty-mark">' + UI.icon("check", 24) + "</div>" +
        "<h3>Nada pendiente</h3><p class=\"txt-2 t-sm\">Todos los eventos enviados ya fueron revisados.</p></div>";
    }
    return '<div class="stack stack-4">' +
      '<div class="row between"><h2 style="font-size:var(--t-lg)">Eventos por aprobar</h2>' +
      '<span class="badge badge-rosa">' + list.length + "</span></div>" +
      '<div class="note"><span>' + UI.icon("shield", 18) + "</span><div class=\"t-sm\">" +
      "Revisamos RFC del promotor, permiso de uso del recinto y congruencia entre aforo declarado y capacidad real. " +
      "Este filtro es lo que impide que se publique un evento inexistente.</div></div>" +
      list.map(function (p) {
        const pr = S.promoter(p.promoterId);
        const v = S.venue(p.venueId);
        const riskBadge = { alto: "badge-rojo", medio: "badge-ambar", bajo: "badge-jade" }[p.risk];
        return '<article class="card stack stack-3">' +
          '<div class="row between" style="gap:var(--s3);align-items:flex-start">' +
          '<div class="stack stack-1 grow" style="min-width:0">' +
          '<span class="t-xs mono txt-3">Enviado ' + UI.relative(p.submitted) + "</span>" +
          "<strong>" + UI.esc(p.title) + "</strong>" +
          '<span class="t-sm txt-2">' + UI.esc(pr.name) + " · " + UI.esc(v.name) + " · " + UI.dateShort(p.date) + "</span>" +
          "</div>" +
          '<span class="badge ' + riskBadge + '">Riesgo ' + p.risk + "</span></div>" +
          '<div class="grid g-2" style="gap:var(--s3)">' +
          '<div class="stack stack-1"><span class="eyebrow">Aforo declarado</span><strong class="mono">' + UI.numf(p.capacity) + "</strong></div>" +
          '<div class="stack stack-1"><span class="eyebrow">Capacidad del recinto</span><strong class="mono">' + UI.numf(v.capacity) + "</strong></div>" +
          '<div class="stack stack-1"><span class="eyebrow">Precio base</span><strong class="mono">' + UI.money(p.base) + "</strong></div>" +
          '<div class="stack stack-1"><span class="eyebrow">Promotor verificado</span><strong>' + (pr.verified ? "Sí" : "No") + "</strong></div>" +
          "</div>" +
          '<div class="note ' + (p.risk === "alto" ? "note-rojo" : p.risk === "medio" ? "note-ambar" : "note-jade") + '">' +
          "<span></span><div class=\"t-sm\">" + UI.esc(p.note) + "</div></div>" +
          '<div class="row row-wrap" style="gap:var(--s2)">' +
          '<button class="btn btn-jade btn-sm" data-approve="' + p.id + '">' + UI.icon("check", 15) + "Aprobar y publicar</button>" +
          '<button class="btn btn-danger btn-sm" data-reject="' + p.id + '">Rechazar</button>' +
          "</div></article>";
      }).join("") + "</div>";
  }

  function eventos() {
    const list = S.events().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    return '<div class="stack stack-4">' +
      '<div class="row between row-wrap" style="gap:var(--s3)">' +
      '<h2 style="font-size:var(--t-lg)">Todos los eventos</h2>' +
      '<input class="input" id="ad-evsearch" placeholder="Filtrar por nombre" style="max-width:240px;min-height:38px">' +
      "</div>" +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Evento</th><th>Promotor</th><th>Fecha</th><th class=\"right\">Ocupación</th><th class=\"right\">Bruto</th><th>Estado</th><th></th>" +
      "</tr></thead><tbody id='ad-evrows'>" + evRows(list) + "</tbody></table></div></div>";
  }
  function evRows(list) {
    return list.map(function (e) {
      const r = S.revenueOfEvent(e.id);
      const pct = Math.round((e.sold / e.capacity) * 100);
      const badge = { publicado: "badge-jade", "en revisión": "badge-ambar", pausado: "badge-rojo", finalizado: "" }[e.status] || "";
      return '<tr data-row="' + UI.esc(e.title.toLowerCase()) + '">' +
        "<td><strong>" + UI.esc(e.title) + "</strong><br><span class=\"t-xs txt-3\">" + UI.esc(S.venue(e.venueId).name) + "</span></td>" +
        '<td class="t-xs">' + UI.esc(S.promoter(e.promoterId).name) + "</td>" +
        '<td class="t-xs mono">' + UI.dateShort(e.date) + "</td>" +
        '<td class="right mono">' + pct + "%</td>" +
        '<td class="right mono">' + UI.compact(r.gross) + "</td>" +
        '<td><span class="badge ' + badge + '">' + e.status + "</span></td>" +
        '<td class="right">' +
        (e.past ? "" :
          e.status === "pausado"
            ? '<button class="btn btn-ghost btn-sm" data-resume="' + e.id + '">Reanudar</button>'
            : '<button class="btn btn-ghost btn-sm" data-pause="' + e.id + '">Pausar</button>') +
        "</td></tr>";
    }).join("");
  }

  function promotores() {
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Promotores registrados</h2>' +
      '<div class="grid g-md-2" style="gap:var(--s3)">' +
      BX.PROMOTERS.map(function (p) {
        const evs = S.eventsOfPromoter(p.id);
        const gross = evs.reduce((s, e) => s + S.revenueOfEvent(e.id).gross, 0);
        return '<article class="card stack stack-3">' +
          '<div class="row between" style="gap:var(--s3);align-items:flex-start">' +
          '<div class="row" style="gap:var(--s3)"><span class="avatar">' + UI.esc(p.name.slice(0, 2).toUpperCase()) + "</span>" +
          '<div class="stack stack-1"><strong>' + UI.esc(p.name) + "</strong>" +
          '<span class="t-xs mono txt-3">' + p.rfc + "</span></div></div>" +
          (p.verified ? '<span class="badge badge-jade">Verificado</span>' : '<span class="badge badge-rojo">Sin verificar</span>') +
          "</div>" +
          '<div class="grid g-2" style="gap:var(--s2)">' +
          '<div class="stack stack-1"><span class="eyebrow">Eventos</span><strong class="mono">' + evs.length + "</strong></div>" +
          '<div class="stack stack-1"><span class="eyebrow">Transaccionado</span><strong class="mono">' + UI.compact(gross) + "</strong></div>" +
          '<div class="stack stack-1"><span class="eyebrow">Contacto</span><span class="t-sm">' + UI.esc(p.contact) + "</span></div>" +
          '<div class="stack stack-1"><span class="eyebrow">Calificación</span><span class="t-sm">' + p.rating + " ★</span></div>" +
          "</div>" +
          (p.verified
            ? '<span class="t-xs txt-3">Documentación completa desde ' + UI.dateShort(p.since) + ".</span>"
            : '<button class="btn btn-jade btn-sm" data-verify="' + p.id + '" style="align-self:flex-start">Marcar como verificado</button>') +
          "</article>";
      }).join("") + "</div></div>";
  }

  function usuarios() {
    const users = S.users();
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Usuarios</h2>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Nombre</th><th>Correo</th><th>Rol</th><th class=\"right\">Órdenes</th><th class=\"right\">Gastado</th><th>Alta</th>" +
      "</tr></thead><tbody>" +
      users.map(function (u) {
        const os = S.orders(u.id);
        const spent = os.filter((o) => o.status !== "reembolsada").reduce((s, o) => s + o.total, 0);
        const badge = { admin: "badge-rosa", promotor: "badge-violeta", staff: "badge-ambar", fan: "" }[u.role];
        return "<tr><td><strong>" + UI.esc(u.name) + "</strong></td>" +
          '<td class="t-xs mono">' + UI.esc(u.email) + "</td>" +
          '<td><span class="badge ' + badge + '">' + u.role + "</span></td>" +
          '<td class="right mono">' + os.length + "</td>" +
          '<td class="right mono">' + UI.money(spent) + "</td>" +
          '<td class="t-xs mono">' + UI.esc(String(u.createdAt).slice(0, 10)) + "</td></tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<div class="note"><span></span><div class="t-sm">' +
      "El personal de Boletix ve nombre, correo e historial de compra, no datos de tarjeta. " +
      "Los números de tarjeta nunca tocan nuestros servidores: los tokeniza la pasarela.</div></div>" +
      "</div>";
  }

  function ordenes() {
    const all = S.orders();
    const refunds = S.all().refunds;
    return '<div class="stack stack-5">' +

      '<div class="stack stack-3">' +
      '<h2 style="font-size:var(--t-lg)">Reembolsos</h2>' +
      '<div class="note note-jade"><span>' + UI.icon("clock", 18) + "</span><div class=\"t-sm\">" +
      "<strong>Compromiso público: " + BX.CONFIG.refundSlaHours + " horas.</strong> " +
      "El referente del sector son 21 días naturales. Cada solicitud abierta arriba de ese plazo dispara alerta al equipo.</div></div>" +
      (refunds.length
        ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Folio</th><th>Orden</th><th class="right">Monto</th><th>Motivo</th><th>Estado</th><th>Vence</th></tr></thead><tbody>' +
          refunds.slice().reverse().map(function (r) {
            const o = S.order(r.orderId);
            const amount = r.amount || (o ? o.total : 0);
            return '<tr><td class="mono t-xs">' + r.id + "</td>" +
              '<td class="mono t-xs">' + r.orderId + "</td>" +
              '<td class="right mono">' + UI.money2(amount) + "</td>" +
              "<td class=\"t-xs\">" + UI.esc(r.reason) + "</td>" +
              '<td><span class="badge ' + (r.status === "completado" ? "badge-jade" : "badge-ambar") + '">' + r.status + "</span></td>" +
              '<td class="t-xs">' + (r.dueAt ? UI.relative(r.dueAt) : "—") + "</td></tr>";
          }).join("") + "</tbody></table></div>"
        : '<p class="txt-3 t-sm">Sin solicitudes de reembolso.</p>') +
      "</div>" +

      '<div class="stack stack-3">' +
      '<h2 style="font-size:var(--t-lg)">Últimas órdenes</h2>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Orden</th><th>Usuario</th><th>Evento</th><th class=\"right\">Boletos</th><th class=\"right\">Total</th><th class=\"right\">Comisión</th><th>Estado</th>" +
      "</tr></thead><tbody>" +
      all.slice(0, 25).map(function (o) {
        const u = S.users().find((x) => x.id === o.userId);
        const ev = S.event(o.eventId);
        const badge = { pagada: "badge-jade", reembolsada: "badge-rojo", usada: "", "en reventa": "badge-violeta" }[o.status] || "";
        return '<tr><td class="mono t-xs">' + o.id + "</td>" +
          "<td class=\"t-xs\">" + UI.esc(u ? u.name : "—") + "</td>" +
          "<td class=\"t-xs\">" + UI.esc(ev ? ev.title : "—") + "</td>" +
          '<td class="right mono">' + o.qty + "</td>" +
          '<td class="right mono">' + UI.money2(o.total) + "</td>" +
          '<td class="right mono" style="color:var(--jade)">' + UI.money2(o.fee) + "</td>" +
          '<td><span class="badge ' + badge + '">' + o.status + "</span></td></tr>";
      }).join("") +
      "</tbody></table></div></div></div>";
  }

  function seguridad() {
    const list = S.incidents();
    return '<div class="stack stack-5">' +
      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      kpi("Bots bloqueados hoy", "1,284", "9 IPs suspendidas", null, "") +
      kpi("QR duplicados", "3", "en los últimos 30 días", null, "") +
      kpi("Publicaciones externas", "7", "boletos detectados fuera", "down", "") +
      kpi("Cuentas suspendidas", "12", "por acaparamiento", null, "") +
      "</div>" +

      '<div class="stack stack-3">' +
      '<h2 style="font-size:var(--t-lg)">Bitácora de incidencias</h2>' +
      list.map(function (i) {
        const sev = { alta: "badge-rojo", media: "badge-ambar", baja: "" }[i.severity];
        const ev = i.eventId ? S.event(i.eventId) : null;
        return '<article class="card stack stack-3">' +
          '<div class="row between" style="gap:var(--s3);align-items:flex-start">' +
          '<div class="stack stack-1 grow" style="min-width:0">' +
          '<span class="t-xs mono txt-3">' + i.id + " · " + UI.relative(i.at) + "</span>" +
          "<strong>" + UI.esc(i.type) + "</strong>" +
          '<span class="t-sm txt-2">' + UI.esc(i.detail) + "</span>" +
          (ev ? '<span class="t-xs txt-3">Evento: ' + UI.esc(ev.title) + "</span>" : "") +
          "</div>" +
          '<div class="stack stack-2" style="align-items:flex-end;flex:none">' +
          '<span class="badge ' + sev + '">' + i.severity + "</span>" +
          '<span class="badge ' + (i.status === "resuelto" ? "badge-jade" : "badge-ambar") + '">' + i.status + "</span>" +
          "</div></div>" +
          (i.status === "abierto"
            ? '<button class="btn btn-ghost btn-sm" data-resolve="' + i.id + '" style="align-self:flex-start">Marcar como resuelta</button>'
            : "") +
          "</article>";
      }).join("") + "</div>" +

      '<div class="note note-violeta"><span>' + UI.icon("shield", 18) + "</span><div class=\"t-sm\">" +
      "<strong>Qué hacemos con la reventa externa.</strong> Cuando detectamos un boleto publicado fuera de Boletix " +
      "por encima de su precio, avisamos al titular y le damos 24 horas para retirarlo. Si no lo hace, " +
      "anulamos el código y reembolsamos al comprador original. Nadie pierde su dinero; el especulador sí pierde el negocio.</div></div>" +
      "</div>";
  }

  function reglas() {
    const C = BX.CONFIG;
    const rows = [
      ["Comisión por servicio", Math.round(C.serviceFeeRate * 100) + "%", "Tarifa plana sobre el precio del boleto. Referencia de mercado: 15% a 20%."],
      ["IVA sobre la comisión", Math.round(C.ivaRate * 100) + "%", "Se calcula sólo sobre nuestra comisión, nunca sobre el boleto."],
      ["Precios dinámicos", "Prohibidos", "Contractualmente vetados para todo promotor. El precio del día uno es el del último boleto."],
      ["Boletos por cuenta", C.maxTicketsPerAccount, "Tope anti-acaparamiento visible para el comprador."],
      ["Apartado en checkout", C.holdMinutes + " min", "Los asientos quedan congelados aunque falle el pago."],
      ["Ventana de reembolso", C.refundHoursBefore + " h antes", "Autoservicio, sin llamadas ni formularios."],
      ["Plazo de devolución", C.refundSlaHours + " h", "Incluye la comisión de servicio. El sector maneja hasta 21 días."],
      ["Tope de reventa", Math.round(C.resaleCapRate * 100) + "% del original", "No existe interfaz para publicar por encima del precio pagado."],
      ["Rotación del QR", C.qrRotateSeconds + " s", "Vuelve inservible cualquier captura de pantalla."],
      ["Dispersión al promotor", "48 h", "Sin retenciones ni fondos de reserva."],
      ["Cuota de alta al promotor", "$0", "Tampoco cobramos exclusividad ni el panel de datos."],
    ];
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Reglas de la plataforma</h2>' +
      '<p class="txt-2 t-sm" style="max-width:64ch">Estos parámetros no son configurables por evento ni negociables por promotor. ' +
      "Son la promesa de producto: si cambian, cambia el contrato con todos los usuarios al mismo tiempo.</p>" +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Parámetro</th><th>Valor</th><th>Por qué</th></tr></thead><tbody>' +
      rows.map((r) => "<tr><td><strong>" + r[0] + "</strong></td><td class=\"mono\">" + r[1] + "</td><td class=\"t-xs txt-2\">" + r[2] + "</td></tr>").join("") +
      "</tbody></table></div>" +
      '<div class="note note-rosa"><span>' + UI.icon("lock", 18) + "</span><div class=\"t-sm\">" +
      "Cambiar cualquiera de estos valores requiere aprobación de dirección y aviso a los usuarios con 30 días de anticipación. " +
      "Es deliberado: la promesa sólo vale si cuesta romperla.</div></div>" +
      "</div>";
  }

  /* ---------- Gráfica de ingreso ---------- */
  function drawChart() {
    const host = document.getElementById("ad-chart");
    if (!host) return;
    const meses = ["Feb", "Mar", "Abr", "May", "Jun", "Jul"];
    const base = S.platformStats().fee / 6;
    const data = meses.map(function (m, i) {
      return { m: m, v: Math.round(base * (0.55 + i * 0.19)) };
    });
    const max = Math.max.apply(null, data.map((d) => d.v));
    const W = 460, H = 180, pad = 32;
    const bw = (W - pad * 2) / data.length;
    const bars = data.map(function (d, i) {
      const h = Math.max(4, ((H - pad * 1.7) * d.v) / max);
      const x = pad + i * bw;
      const y = H - pad * 0.9 - h;
      const last = i === data.length - 1;
      return '<rect x="' + (x + 6) + '" y="' + y + '" width="' + (bw - 12) + '" height="' + h +
        '" rx="4" fill="' + (last ? "var(--accent)" : "var(--violeta)") + '" opacity="' + (last ? 1 : .5) + '"><title>' +
        d.m + ": " + UI.money(d.v) + "</title></rect>" +
        '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" font-size="9" fill="var(--txt-3)" text-anchor="middle" font-family="DM Mono, monospace">' + d.m + "</text>" +
        (last ? '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" font-size="10" fill="var(--accent)" text-anchor="middle" font-family="DM Mono, monospace" font-weight="500">' + UI.compact(d.v) + "</text>" : "");
    }).join("");
    host.innerHTML =
      '<div style="overflow-x:auto"><svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;min-width:320px;height:auto" role="img" aria-label="Ingreso por comisión de los últimos seis meses">' +
      '<line x1="' + pad + '" y1="' + (H - pad * 0.9) + '" x2="' + (W - pad) + '" y2="' + (H - pad * 0.9) + '" stroke="var(--line)"/>' +
      bars + "</svg></div>" +
      '<p class="t-xs txt-3" style="margin-top:var(--s2)">Ingreso por comisión del 7%. La meta del año uno son $3.92 M sobre $56 M transaccionados.</p>';
  }

  /* ---------- Acciones (delegación única) ---------- */
  view.addEventListener("click", function (e) {
    const ap = e.target.closest("[data-approve]");
    if (ap) {
      S.resolvePending(ap.dataset.approve, "aprobado");
      UI.toast("Evento aprobado y publicado en la cartelera.", "ok");
      return refresh();
    }
    const rj = e.target.closest("[data-reject]");
    if (rj) {
      UI.confirm("Rechazar evento", "Se notifica al promotor con el motivo de la revisión. Puede volver a enviarlo corregido.",
        "Rechazar", function () {
          S.resolvePending(rj.dataset.reject, "rechazado");
          UI.toast("Evento rechazado. Promotor notificado.", "ok");
          refresh();
        }, "btn-danger");
      return;
    }
    const pa = e.target.closest("[data-pause]");
    if (pa) {
      S.setEventStatus(pa.dataset.pause, "pausado");
      UI.toast("Venta pausada. El evento deja de aparecer en la cartelera.", "ok");
      return refresh();
    }
    const re = e.target.closest("[data-resume]");
    if (re) {
      S.setEventStatus(re.dataset.resume, "publicado");
      UI.toast("Venta reanudada.", "ok");
      return refresh();
    }
    const rs = e.target.closest("[data-resolve]");
    if (rs) {
      S.resolveIncident(rs.dataset.resolve);
      UI.toast("Incidencia cerrada.", "ok");
      return refresh();
    }
    const vf = e.target.closest("[data-verify]");
    if (vf) {
      const p = S.promoter(vf.dataset.verify);
      if (p) { p.verified = true; S.save(); }
      UI.toast("Promotor verificado. Ya puede publicar y cobrar.", "ok");
      return refresh();
    }
  });

  function bind() {
    const search = document.getElementById("ad-evsearch");
    if (search) {
      search.addEventListener("input", function () {
        const q = search.value.trim().toLowerCase();
        UI.$$("#ad-evrows tr").forEach(function (tr) {
          tr.style.display = !q || tr.dataset.row.indexOf(q) >= 0 ? "" : "none";
        });
      });
    }
  }

  function render() {
    const map = { resumen, aprobaciones, eventos, promotores, usuarios, ordenes, seguridad, reglas };
    view.innerHTML = (map[current] || resumen)();
    BX.app.fillIconSlots(view);
    drawChart();
    bind();
  }
  function refresh() { renderHead(); renderSide(); render(); }

  renderHead();
  renderSide();
  render();
})();
