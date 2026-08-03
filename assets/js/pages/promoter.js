/* BOLETIX — Panel del promotor B2B */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const user = BX.app.requireAuth(["promotor", "admin"]);
  if (!user) return;

  const promoterId = user.promoterId || "p01";
  const promoter = S.promoter(promoterId);

  const SECTIONS = [
    { id: "resumen", label: "Resumen", icon: "chart" },
    { id: "eventos", label: "Mis eventos", icon: "calendar" },
    { id: "nuevo", label: "Crear evento", icon: "plus" },
    { id: "publico", label: "Mi público", icon: "users" },
    { id: "liquidacion", label: "Liquidación", icon: "money" },
  ];
  let current = (location.hash || "#resumen").slice(1);
  if (!SECTIONS.some((s) => s.id === current)) current = "resumen";

  const view = document.getElementById("pr-view");

  /* ---------- Cifras ---------- */
  function totals() {
    const evs = S.eventsOfPromoter(promoterId);
    let gross = 0, tickets = 0, cap = 0;
    evs.forEach(function (e) {
      const r = S.revenueOfEvent(e.id);
      gross += r.gross; tickets += r.tickets; cap += e.capacity;
    });
    const fee = gross * BX.CONFIG.serviceFeeRate;
    return {
      events: evs.length,
      live: evs.filter((e) => !e.past && e.status === "publicado").length,
      gross: gross, fee: fee, net: gross - fee,
      tickets: tickets,
      fill: cap ? Math.round((tickets / cap) * 100) : 0,
    };
  }

  function renderHead() {
    const t = totals();
    document.getElementById("pr-head").innerHTML =
      '<div class="stack stack-4">' +
      '<div class="row between row-wrap" style="gap:var(--s3)">' +
      '<div class="row" style="gap:var(--s3)">' +
      '<span class="avatar avatar-lg">' + UI.esc(promoter.name.slice(0, 2).toUpperCase()) + "</span>" +
      '<div class="stack stack-1">' +
      '<span class="eyebrow">Panel del promotor</span>' +
      '<h1 style="font-size:var(--t-xl)">' + UI.esc(promoter.name) + "</h1>" +
      '<div class="row" style="gap:var(--s2)">' +
      (promoter.verified ? '<span class="badge badge-jade">' + UI.icon("check", 12) + " Verificado</span>" : '<span class="badge badge-rojo">Sin verificar</span>') +
      '<span class="badge">RFC ' + promoter.rfc + "</span>" +
      "</div></div></div>" +
      '<a class="btn btn-primary btn-sm" href="#nuevo" id="pr-new">' + UI.icon("plus", 16) + "Crear evento</a>" +
      "</div>" +
      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      kpi("Vendido bruto", UI.compact(t.gross), t.tickets + " boletos", "up", "+12% vs. mes pasado") +
      kpi("Te liquidamos", UI.compact(t.net), "comisión de " + UI.compact(t.fee), null, "7% plano, sin extras") +
      kpi("Ocupación media", t.fill + "%", t.live + " eventos en venta", "up", "+4 pts") +
      kpi("Dispersión", "48 h", "tras cada evento", null, "sin retenciones") +
      "</div></div>";
    document.getElementById("pr-new").addEventListener("click", function () {
      current = "nuevo"; renderSide(); render();
    });
  }
  function kpi(label, value, sub, dir, delta) {
    return '<div class="stat">' +
      '<div class="stat-label">' + label + "</div>" +
      '<div class="stat-value">' + value + "</div>" +
      '<div class="row between"><span class="t-xs txt-3">' + sub + "</span>" +
      (delta ? '<span class="stat-delta ' + (dir === "up" ? "delta-up" : dir === "down" ? "delta-down" : "txt-3") + '">' + delta + "</span>" : "") +
      "</div></div>";
  }

  /* ---------- Menú ---------- */
  function renderSide() {
    document.getElementById("pr-side").innerHTML = SECTIONS.map(function (s) {
      return '<button class="side-item' + (s.id === current ? " is-active" : "") + '" data-go="' + s.id + '">' +
        UI.icon(s.icon, 18) + s.label + "</button>";
    }).join("");
  }
  document.getElementById("pr-side").addEventListener("click", function (e) {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    current = b.dataset.go;
    history.replaceState(null, "", "#" + current);
    renderSide(); render();
  });

  /* ================= SECCIONES ================= */

  function resumen() {
    const evs = S.eventsOfPromoter(promoterId).filter((e) => !e.past)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return '<div class="stack stack-5">' +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Venta de los últimos 14 días</h2>' +
      '<span class="badge badge-jade">En vivo</span></div>' +
      '<div class="panel-body"><div id="pr-chart"></div></div></div>' +

      '<div class="panel"><div class="panel-head"><h2 style="font-size:var(--t-base)">Eventos en venta</h2>' +
      '<span class="badge">' + evs.length + "</span></div>" +
      '<div class="panel-body stack stack-3">' +
      (evs.length ? evs.map(eventRow).join("") : '<p class="txt-3 t-sm">Sin eventos activos.</p>') +
      "</div></div>" +

      '<div class="grid g-md-2" style="gap:var(--s4)">' +
      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Zonas que más se venden</h3></div>' +
      '<div class="panel-body stack stack-3" id="pr-zones"></div></div>' +
      '<div class="panel"><div class="panel-head"><h3 style="font-size:var(--t-base)">Lo que no te cobramos</h3></div>' +
      '<div class="panel-body stack stack-3 t-sm">' +
      [["Cuota de alta", "$0"], ["Exclusividad", "No exigimos"], ["Retención de fondos", "0 días extra"],
       ["Cargo por cancelar", "$0"], ["Costo del panel de datos", "$0"]].map(function (x) {
        return '<div class="row between"><span class="txt-2">' + x[0] + '</span><strong style="color:var(--jade)">' + x[1] + "</strong></div>";
      }).join("") +
      '<p class="t-xs txt-3" style="margin:0">Nuestro único ingreso por tu evento es el 7% del boleto, que paga la persona compradora y viene desglosado desde el primer clic.</p>' +
      "</div></div></div>" +

      "</div>";
  }

  function eventRow(e) {
    const r = S.revenueOfEvent(e.id);
    const pct = Math.round((e.sold / e.capacity) * 100);
    const venue = S.venue(e.venueId);
    return (
      '<div class="card card-flat stack stack-3">' +
      '<div class="row between" style="gap:var(--s3);align-items:flex-start">' +
      '<div class="stack stack-1 grow" style="min-width:0">' +
      '<span class="t-xs mono txt-3">' + UI.dateShort(e.date) + " · " + UI.esc(venue.name) + "</span>" +
      "<strong>" + UI.esc(e.title) + "</strong>" +
      '<span class="t-sm txt-2">' + UI.numf(e.sold) + " de " + UI.numf(e.capacity) + " boletos · " + UI.relative(e.date) + "</span>" +
      "</div>" +
      '<div class="right" style="flex:none"><div class="mono" style="font-weight:500">' + UI.compact(r.gross) + "</div>" +
      '<div class="t-xs txt-3">bruto</div></div>' +
      "</div>" +
      '<div class="bar-track"><i style="width:' + pct + "%;background:" + (pct > 85 ? "var(--jade)" : pct > 50 ? "var(--ambar)" : "var(--accent)") + '"></i></div>' +
      '<div class="row between t-xs txt-3"><span>' + pct + "% de ocupación</span>" +
      "<span>Te liquidamos " + UI.compact(r.net) + "</span></div>" +
      '<div class="row row-wrap" style="gap:var(--s2)">' +
      '<a class="btn btn-ghost btn-sm" href="evento.html?id=' + e.id + '">Ver ficha pública</a>' +
      '<button class="btn btn-ghost btn-sm" data-detail="' + e.id + '">Desglose por zona</button>' +
      "</div></div>"
    );
  }

  function eventos() {
    const evs = S.eventsOfPromoter(promoterId).sort((a, b) => new Date(b.date) - new Date(a.date));
    return '<div class="stack stack-4">' +
      '<div class="row between"><h2 style="font-size:var(--t-lg)">Todos mis eventos</h2>' +
      '<span class="badge">' + evs.length + "</span></div>" +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Evento</th><th>Fecha</th><th>Recinto</th><th class=\"right\">Vendidos</th><th class=\"right\">Bruto</th><th class=\"right\">Tu neto</th><th>Estado</th>" +
      "</tr></thead><tbody>" +
      evs.map(function (e) {
        const r = S.revenueOfEvent(e.id);
        const badge = { publicado: "badge-jade", "en revisión": "badge-ambar", finalizado: "", pausado: "badge-rojo" }[e.status] || "";
        return "<tr>" +
          "<td><strong>" + UI.esc(e.title) + "</strong><br><span class=\"t-xs txt-3\">" + UI.esc(e.subtitle || "") + "</span></td>" +
          '<td class="t-xs mono">' + UI.dateShort(e.date) + "</td>" +
          '<td class="t-xs">' + UI.esc(S.venue(e.venueId).name) + "</td>" +
          '<td class="right mono">' + UI.numf(e.sold) + " / " + UI.numf(e.capacity) + "</td>" +
          '<td class="right mono">' + UI.compact(r.gross) + "</td>" +
          '<td class="right mono">' + UI.compact(r.net) + "</td>" +
          '<td><span class="badge ' + badge + '">' + e.status + "</span></td>" +
          "</tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<button class="btn btn-ghost btn-sm" id="pr-export" style="align-self:flex-start">' +
      UI.icon("doc", 15) + "Exportar a CSV</button>" +
      '<p class="t-xs txt-3">Los datos de tu público son tuyos. Puedes llevártelos cuando quieras, en formato abierto, sin pedirlo por correo.</p>' +
      "</div>";
  }

  function nuevo() {
    return '<div class="stack stack-4">' +
      '<h2 style="font-size:var(--t-lg)">Crear evento</h2>' +
      '<div class="note note-ambar"><span></span><div class="t-sm">' +
      "Todo evento pasa por revisión: validamos el permiso de uso del recinto y el aforo declarado antes de publicarlo. " +
      "Suele tomar menos de un día hábil. Es lo que impide que alguien publique un evento que no existe.</div></div>" +

      '<form class="panel" id="ne-form"><div class="panel-body stack stack-4">' +
      '<div class="field"><label class="label" for="ne-title">Nombre del evento</label>' +
      '<input class="input" id="ne-title" placeholder="Ej. Siberia Nocturna" required></div>' +
      '<div class="field"><label class="label" for="ne-sub">Subtítulo</label>' +
      '<input class="input" id="ne-sub" placeholder="Ej. Gira Ecos del Norte 2026"></div>' +

      '<div class="grid g-md-2" style="gap:var(--s3)">' +
      '<div class="field"><label class="label" for="ne-cat">Categoría</label>' +
      '<select class="select" id="ne-cat">' + BX.CATEGORIES.map((c) => '<option value="' + c.id + '">' + c.name + "</option>").join("") + "</select></div>" +
      '<div class="field"><label class="label" for="ne-venue">Recinto</label>' +
      '<select class="select" id="ne-venue">' + BX.VENUES.map((v) => '<option value="' + v.id + '">' + UI.esc(v.name) + " (" + UI.numf(v.capacity) + ")</option>").join("") + "</select></div>" +
      '<div class="field"><label class="label" for="ne-date">Fecha y hora</label>' +
      '<input class="input" id="ne-date" type="datetime-local" required></div>' +
      '<div class="field"><label class="label" for="ne-base">Precio base del boleto</label>' +
      '<input class="input mono" id="ne-base" type="number" min="50" step="10" value="600" required>' +
      '<span class="hint">Las zonas se calculan a partir de este precio. Lo puedes ajustar después.</span></div>' +
      '<div class="field"><label class="label" for="ne-age">Edad mínima</label>' +
      '<input class="input mono" id="ne-age" type="number" min="0" max="21" value="0"></div>' +
      '<div class="field"><label class="label" for="ne-pal">Estilo del cartel</label>' +
      '<select class="select" id="ne-pal">' + Object.keys(BX.PALETTES).map((p) => "<option>" + p + "</option>").join("") + "</select></div>" +
      "</div>" +

      '<div class="field"><label class="label" for="ne-lineup">Cartel (separado por comas)</label>' +
      '<input class="input" id="ne-lineup" placeholder="Artista principal, Telonero, Invitado"></div>' +
      '<div class="field"><label class="label" for="ne-tags">Etiquetas (separadas por comas)</label>' +
      '<input class="input" id="ne-tags" placeholder="indie, rock, gira"></div>' +
      '<div class="field"><label class="label" for="ne-about">Descripción</label>' +
      '<textarea class="textarea" id="ne-about" placeholder="Qué va a pasar esa noche, en dos o tres frases."></textarea></div>' +

      '<hr class="divider">' +
      '<div class="stack stack-3">' +
      '<h3 style="font-size:var(--t-base)">Reglas que aceptas al publicar</h3>' +
      '<label class="check"><input type="checkbox" id="ne-r1"> <span>No usaré precios dinámicos. El precio publicado es el precio del último boleto.</span></label>' +
      '<label class="check"><input type="checkbox" id="ne-r2"> <span>Acepto reembolso completo al comprador hasta ' + BX.CONFIG.refundHoursBefore + " horas antes.</span></label>" +
      '<label class="check"><input type="checkbox" id="ne-r3"> <span>Tengo el permiso de uso del recinto y puedo comprobarlo.</span></label>' +
      "</div>" +
      '<div id="ne-preview"></div>' +
      '<button class="btn btn-primary btn-lg btn-block" type="submit">Enviar a revisión</button>' +
      "</div></form></div>";
  }

  function publico() {
    const evs = S.eventsOfPromoter(promoterId);
    const orders = [];
    evs.forEach((e) => S.ordersOfEvent(e.id).forEach((o) => orders.push(o)));
    const buyers = {};
    orders.forEach(function (o) {
      const u = S.users().find((x) => x.id === o.userId);
      const key = u ? u.id : o.userId;
      if (!buyers[key]) buyers[key] = { name: u ? u.name : "Comprador", email: u ? u.email : "—", tickets: 0, spent: 0, events: new Set() };
      buyers[key].tickets += o.qty;
      buyers[key].spent += o.total;
      buyers[key].events.add(o.eventId);
    });
    const list = Object.values(buyers).sort((a, b) => b.spent - a.spent);

    return '<div class="stack stack-5">' +
      '<h2 style="font-size:var(--t-lg)">Mi público</h2>' +
      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      kpi("Compradores únicos", UI.numf(list.length), "en todos tus eventos", null, "") +
      kpi("Boletos por persona", (list.length ? (list.reduce((s, b) => s + b.tickets, 0) / list.length) : 0).toFixed(1), "promedio", null, "") +
      kpi("Compran en fin de semana", "65%", "viernes a domingo", null, "") +
      kpi("Recurrencia", "38%", "vuelven a otro evento tuyo", "up", "") +
      "</div>" +
      (list.length
        ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Persona</th><th>Correo</th><th class="right">Boletos</th><th class="right">Gastado</th><th class="right">Eventos</th></tr></thead><tbody>' +
          list.map(function (b) {
            return "<tr><td><strong>" + UI.esc(b.name) + "</strong></td><td class=\"t-xs mono\">" + UI.esc(b.email) + "</td>" +
              '<td class="right mono">' + b.tickets + "</td><td class=\"right mono\">" + UI.money(b.spent) + "</td>" +
              '<td class="right mono">' + b.events.size + "</td></tr>";
          }).join("") + "</tbody></table></div>"
        : '<p class="txt-3 t-sm">Aún no hay compradores registrados en tus eventos.</p>') +
      '<div class="note"><span></span><div class="t-sm">' +
      "Compartimos estos datos contigo porque son de tu evento. No los vendemos a terceros ni los usamos " +
      "para venderte publicidad. Las personas pueden pedirnos que dejemos de compartirlos en cualquier momento.</div></div>" +
      "</div>";
  }

  function liquidacion() {
    const evs = S.eventsOfPromoter(promoterId);
    const rows = evs.map(function (e) {
      const r = S.revenueOfEvent(e.id);
      const paid = e.past;
      return { e: e, r: r, paid: paid };
    }).sort((a, b) => new Date(b.e.date) - new Date(a.e.date));
    const pendiente = rows.filter((x) => !x.paid).reduce((s, x) => s + x.r.net, 0);
    const pagado = rows.filter((x) => x.paid).reduce((s, x) => s + x.r.net, 0);

    return '<div class="stack stack-5">' +
      '<h2 style="font-size:var(--t-lg)">Liquidación</h2>' +
      '<div class="grid g-2 g-md-4" style="gap:var(--s3)">' +
      kpi("Por liquidar", UI.compact(pendiente), "se dispersa 48 h tras cada evento", null, "") +
      kpi("Ya depositado", UI.compact(pagado), "eventos finalizados", null, "") +
      kpi("Cuenta destino", promoter.payout, "cambiar requiere verificación", null, "") +
      kpi("Comisión Boletix", "7%", "plana, sin conceptos extra", null, "") +
      "</div>" +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      "<th>Evento</th><th>Fecha</th><th class=\"right\">Bruto</th><th class=\"right\">Comisión 7%</th><th class=\"right\">Tu neto</th><th>Estado</th>" +
      "</tr></thead><tbody>" +
      rows.map(function (x) {
        return "<tr><td><strong>" + UI.esc(x.e.title) + "</strong></td>" +
          '<td class="t-xs mono">' + UI.dateShort(x.e.date) + "</td>" +
          '<td class="right mono">' + UI.money(x.r.gross) + "</td>" +
          '<td class="right mono" style="color:var(--txt-3)">−' + UI.money(x.r.fee) + "</td>" +
          '<td class="right mono" style="font-weight:600">' + UI.money(x.r.net) + "</td>" +
          '<td><span class="badge ' + (x.paid ? "badge-jade" : "badge-ambar") + '">' + (x.paid ? "depositado" : "por liquidar") + "</span></td></tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<div class="note note-jade"><span></span><div class="t-sm">' +
      "<strong>Cobras el jueves lo que vendiste el miércoles.</strong> Dispersamos a 48 horas del evento, " +
      "sin retenciones adicionales ni fondos de reserva. Si el evento se cancela, el reembolso a los compradores " +
      "lo cubrimos nosotros primero y lo conciliamos contigo después.</div></div>" +
      "</div>";
  }

  /* ---------- Gráfica de ventas ---------- */
  function drawChart() {
    const host = document.getElementById("pr-chart");
    if (!host) return;
    const days = 14;
    const evs = S.eventsOfPromoter(promoterId);
    const seed = UI.hash(promoterId);
    const data = Array.from({ length: days }, function (_, i) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      const dow = d.getDay();
      // Fin de semana y quincenas concentran la venta, como en el estudio de demanda.
      const weekend = dow === 5 || dow === 6 || dow === 0 ? 1.9 : 1;
      const payday = d.getDate() === 15 || d.getDate() === 30 || d.getDate() === 1 ? 1.35 : 1;
      const noise = 0.55 + ((seed >> (i % 20)) % 100) / 120;
      return { date: d, value: Math.round(9000 * weekend * payday * noise * (evs.length / 4 + 0.6)) };
    });
    const max = Math.max.apply(null, data.map((d) => d.value));
    const W = 640, H = 170, pad = 26;
    const bw = (W - pad * 2) / days;

    const bars = data.map(function (d, i) {
      const h = Math.max(3, ((H - pad * 1.6) * d.value) / max);
      const x = pad + i * bw;
      const y = H - pad * 0.7 - h;
      const dow = d.date.getDay();
      const hot = dow === 5 || dow === 6 || dow === 0;
      return '<rect x="' + (x + 2) + '" y="' + y + '" width="' + (bw - 5) + '" height="' + h +
        '" rx="3" fill="' + (hot ? "var(--accent)" : "var(--violeta)") + '" opacity="' + (hot ? 1 : .55) + '">' +
        "<title>" + d.date.getDate() + " · " + UI.money(d.value) + "</title></rect>" +
        (i % 3 === 0
          ? '<text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" font-size="8.5" fill="var(--txt-3)" text-anchor="middle" font-family="DM Mono, monospace">' + d.date.getDate() + "</text>"
          : "");
    }).join("");

    host.innerHTML =
      '<div style="overflow-x:auto"><svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;min-width:420px;height:auto" role="img" aria-label="Venta diaria de los últimos 14 días">' +
      '<line x1="' + pad + '" y1="' + (H - pad * 0.7) + '" x2="' + (W - pad) + '" y2="' + (H - pad * 0.7) + '" stroke="var(--line)" stroke-width="1"/>' +
      bars + "</svg></div>" +
      '<div class="row row-wrap t-sm" style="gap:var(--s4);margin-top:var(--s3)">' +
      '<span class="row t-sm" style="gap:6px"><i class="zone-dot" style="background:var(--accent)"></i>Viernes a domingo</span>' +
      '<span class="row t-sm" style="gap:6px"><i class="zone-dot" style="background:var(--violeta);opacity:.55"></i>Entre semana</span>' +
      "</div>" +
      '<p class="t-xs txt-3" style="margin-top:var(--s2)">El 65% de la venta se concentra de viernes a domingo, y sube otro 25% en quincenas. ' +
      "Programamos capacidad extra de servidor en esos picos.</p>";
  }

  function drawZones() {
    const host = document.getElementById("pr-zones");
    if (!host) return;
    const agg = {};
    S.eventsOfPromoter(promoterId).forEach(function (e) {
      e.zones.forEach(function (z) {
        agg[z.name] = agg[z.name] || { sold: 0, cap: 0, color: z.color };
        agg[z.name].sold += z.sold;
        agg[z.name].cap += z.capacity;
      });
    });
    const rows = Object.entries(agg).sort((a, b) => b[1].sold - a[1].sold).slice(0, 6);
    host.innerHTML = rows.map(function (r) {
      const pct = r[1].cap ? Math.round((r[1].sold / r[1].cap) * 100) : 0;
      return '<div class="stack stack-1">' +
        '<div class="row between t-sm"><span>' + UI.esc(r[0]) + "</span>" +
        '<strong class="mono">' + pct + "%</strong></div>" +
        '<div class="bar-track"><i style="width:' + pct + "%;background:" + r[1].color + '"></i></div></div>';
    }).join("");
  }

  /* ---------- Acciones ----------
     La delegación se registra una sola vez; bind() sólo conecta
     los controles que se recrean en cada render. */
  view.addEventListener("click", function (e) {
      const d = e.target.closest("[data-detail]");
      if (d) {
        const ev = S.event(d.dataset.detail);
        UI.modal({
          title: ev.title,
          wide: true,
          body: '<div class="table-wrap"><table class="tbl" style="min-width:auto"><thead><tr>' +
            "<th>Zona</th><th class=\"right\">Precio</th><th class=\"right\">Vendidos</th><th class=\"right\">Aforo</th><th class=\"right\">Bruto</th></tr></thead><tbody>" +
            ev.zones.map(function (z) {
              return "<tr><td><span class=\"row\" style=\"gap:8px\"><i class=\"zone-dot\" style=\"background:" + z.color + '"></i>' + UI.esc(z.name) + "</span></td>" +
                '<td class="right mono">' + UI.money(z.price) + "</td>" +
                '<td class="right mono">' + UI.numf(z.sold) + "</td>" +
                '<td class="right mono">' + UI.numf(z.capacity) + "</td>" +
                '<td class="right mono">' + UI.money(z.price * z.sold) + "</td></tr>";
            }).join("") + "</tbody></table></div>",
          actions: [{ label: "Cerrar", variant: "btn-ghost" }],
        });
      }
  });

  function bind() {
    const exp = document.getElementById("pr-export");
    if (exp) exp.addEventListener("click", function () {
      const rows = [["Evento", "Fecha", "Recinto", "Vendidos", "Aforo", "Bruto", "Comision", "Neto", "Estado"]];
      S.eventsOfPromoter(promoterId).forEach(function (e) {
        const r = S.revenueOfEvent(e.id);
        rows.push([e.title, e.date, S.venue(e.venueId).name, e.sold, e.capacity,
          r.gross.toFixed(2), r.fee.toFixed(2), r.net.toFixed(2), e.status]);
      });
      const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "boletix-eventos-" + promoterId + ".csv";
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
      UI.toast("CSV descargado.", "ok");
    });

    const form = document.getElementById("ne-form");
    if (form) {
      const preview = document.getElementById("ne-preview");
      function syncPreview() {
        const base = Number(document.getElementById("ne-base").value) || 600;
        const venue = S.venue(document.getElementById("ne-venue").value);
        const zones = BX.zoneTemplate(venue.layout, base);
        preview.innerHTML =
          '<div class="card card-flat stack stack-3">' +
          '<span class="eyebrow">Así quedarían tus zonas</span>' +
          zones.map(function (z) {
            const p = Math.round(z.price / 10) * 10;
            return '<div class="row between t-sm"><span class="row" style="gap:8px">' +
              '<i class="zone-dot" style="background:' + z.color + '"></i>' + UI.esc(z.name) + " · " + UI.numf(z.capacity) + " lugares</span>" +
              '<span><strong class="mono">' + UI.money(p) + '</strong> <span class="txt-3">→ ' + UI.money(BX.ptr(p)) + " al público</span></span></div>";
          }).join("") +
          '<p class="t-xs txt-3" style="margin:0">La columna derecha es el Precio Total Real que verá la persona compradora: ' +
          "tu precio más el 7% de comisión y su IVA. Sin conceptos adicionales.</p></div>";
      }
      document.getElementById("ne-base").addEventListener("input", syncPreview);
      document.getElementById("ne-venue").addEventListener("change", syncPreview);
      syncPreview();

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const title = document.getElementById("ne-title").value.trim();
        const date = document.getElementById("ne-date").value;
        if (title.length < 3) return UI.toast("Ponle un nombre al evento.", "err");
        if (!date) return UI.toast("Falta la fecha y hora.", "err");
        if (new Date(date) < Date.now()) return UI.toast("La fecha ya pasó. Elige una futura.", "err");
        if (!document.getElementById("ne-r1").checked ||
            !document.getElementById("ne-r2").checked ||
            !document.getElementById("ne-r3").checked) {
          return UI.toast("Necesitas aceptar las tres reglas para publicar en Boletix.", "err");
        }
        S.createEvent({
          title: title,
          subtitle: document.getElementById("ne-sub").value.trim(),
          category: document.getElementById("ne-cat").value,
          venueId: document.getElementById("ne-venue").value,
          promoterId: promoterId,
          date: date,
          base: document.getElementById("ne-base").value,
          minAge: document.getElementById("ne-age").value,
          palette: document.getElementById("ne-pal").value,
          lineup: document.getElementById("ne-lineup").value,
          tags: document.getElementById("ne-tags").value,
          about: document.getElementById("ne-about").value.trim(),
        });
        UI.toast("Evento enviado a revisión. Te avisamos en menos de un día hábil.", "ok");
        current = "eventos";
        history.replaceState(null, "", "#eventos");
        renderHead(); renderSide(); render();
      });
    }
  }

  function render() {
    const map = { resumen, eventos, nuevo, publico, liquidacion };
    view.innerHTML = (map[current] || resumen)();
    BX.app.fillIconSlots(view);
    drawChart();
    drawZones();
    bind();
  }

  renderHead();
  renderSide();
  render();
})();
