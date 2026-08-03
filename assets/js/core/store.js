/* ============================================================
   BOLETIX — Estado de la aplicación
   Persistencia en localStorage con respaldo en memoria si el
   navegador la bloquea (por ejemplo al abrir con file://).
   ============================================================ */
(function () {
  "use strict";
  const BX = (window.BX = window.BX || {});
  const KEY = "boletix.state.v1";
  const SESSION_KEY = "boletix.session.v1";

  /* ---------- Almacenamiento tolerante a fallos ---------- */
  const memory = {};
  const disk = (function () {
    try {
      const t = "__bx__";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      return window.localStorage;
    } catch (e) {
      return {
        getItem: (k) => (k in memory ? memory[k] : null),
        setItem: (k, v) => { memory[k] = String(v); },
        removeItem: (k) => { delete memory[k]; },
      };
    }
  })();

  function read(key, fallback) {
    try {
      const raw = disk.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { disk.setItem(key, JSON.stringify(value)); } catch (e) { /* memoria */ }
  }

  /* ---------- Semilla ---------- */
  function seed() {
    const events = BX.buildEvents();
    return {
      version: 1,
      seededAt: new Date().toISOString(),
      users: JSON.parse(JSON.stringify(BX.USERS)),
      events: events,
      orders: BX.buildOrders(events),
      resale: BX.buildResale(events),
      refunds: JSON.parse(JSON.stringify(BX.REFUNDS)),
      pending: JSON.parse(JSON.stringify(BX.PENDING_EVENTS)),
      incidents: JSON.parse(JSON.stringify(BX.INCIDENTS)),
      waitlist: [],       // alertas de preventa
      transfers: [],      // historial de transferencias de boletos
      scans: [],          // bitácora de la app de puerta
      cart: null,         // compra en curso
      queue: null,        // fila virtual activa
      counter: 1100,      // folio incremental de órdenes
    };
  }

  let state = read(KEY, null);
  if (!state || state.version !== 1) { state = seed(); write(KEY, state); }

  const S = (BX.store = {});

  S.all = function () { return state; };
  S.save = function () { write(KEY, state); };
  S.reset = function () { state = seed(); write(KEY, state); S.logout(); };

  /* ---------- Sesión ---------- */
  S.session = function () {
    const s = read(SESSION_KEY, null);
    if (!s) return null;
    const u = state.users.find((x) => x.id === s.userId);
    return u || null;
  };
  S.login = function (email, password) {
    const u = state.users.find(
      (x) => x.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!u) return { ok: false, error: "No encontramos una cuenta con ese correo." };
    if (u.password !== password) return { ok: false, error: "La contraseña no coincide. Revísala e intenta de nuevo." };
    write(SESSION_KEY, { userId: u.id, at: Date.now() });
    return { ok: true, user: u };
  };
  S.logout = function () { try { disk.removeItem(SESSION_KEY); } catch (e) {} };
  S.register = function (data) {
    const exists = state.users.some((x) => x.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { ok: false, error: "Ese correo ya tiene una cuenta en Boletix. Inicia sesión." };
    const u = {
      id: "u_" + Math.random().toString(36).slice(2, 9),
      role: "fan",
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || "",
      birth: data.birth || "",
      createdAt: new Date().toISOString().slice(0, 10),
      cards: [], follows: [],
      prefs: { alerts: !!data.alerts, newsletter: !!data.newsletter, accessibility: false },
    };
    state.users.push(u);
    S.save();
    write(SESSION_KEY, { userId: u.id, at: Date.now() });
    return { ok: true, user: u };
  };
  S.updateUser = function (patch) {
    const u = S.session();
    if (!u) return null;
    Object.assign(u, patch);
    S.save();
    return u;
  };

  /* ---------- Consultas de eventos ---------- */
  S.events = function () { return state.events; };
  S.event = function (id) { return state.events.find((e) => e.id === id) || null; };
  S.venue = function (id) { return BX.VENUES.find((v) => v.id === id) || null; };
  S.promoter = function (id) { return BX.PROMOTERS.find((p) => p.id === id) || null; };
  S.upcoming = function () {
    return state.events
      .filter((e) => !e.past && e.status === "publicado")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  S.zone = function (event, zoneId) { return event.zones.find((z) => z.id === zoneId) || null; };
  S.available = function (event, zoneId) {
    const z = S.zone(event, zoneId);
    return z ? Math.max(0, z.capacity - z.sold) : 0;
  };
  S.minPrice = function (event) { return Math.min.apply(null, event.zones.map((z) => z.price)); };
  S.maxPrice = function (event) { return Math.max.apply(null, event.zones.map((z) => z.price)); };

  /* ---------- Tope anti-bots ---------- */
  S.ticketsOwnedFor = function (userId, eventId) {
    return state.orders
      .filter((o) => o.userId === userId && o.eventId === eventId && o.status !== "reembolsada")
      .reduce((s, o) => s + o.qty, 0);
  };
  S.remainingAllowance = function (userId, eventId) {
    return Math.max(0, BX.CONFIG.maxTicketsPerAccount - S.ticketsOwnedFor(userId, eventId));
  };

  /* ---------- Fila virtual ---------- */
  S.startQueue = function (eventId) {
    const ev = S.event(eventId);
    if (!ev) return null;
    // La posición depende de la demanda real del evento.
    const heat = ev.sold / ev.capacity;
    const base = ev.trending ? 900 : 200;
    const pos = Math.max(4, Math.round(base * (0.5 + heat) * (0.6 + Math.random() * 0.8)));
    state.queue = {
      eventId: eventId,
      startedAt: Date.now(),
      initialPos: pos,
      position: pos,
      rate: 18 + Math.round(Math.random() * 26),   // personas atendidas por segundo simulado
      lockedPrices: ev.zones.map((z) => ({ id: z.id, price: z.price })),
      done: false,
    };
    S.save();
    return state.queue;
  };
  S.queue = function () { return state.queue; };
  S.tickQueue = function () {
    const q = state.queue;
    if (!q || q.done) return q;
    q.position = Math.max(0, q.position - q.rate);
    if (q.position === 0) q.done = true;
    S.save();
    return q;
  };
  S.clearQueue = function () { state.queue = null; S.save(); };

  /* ---------- Carrito con congelamiento ---------- */
  S.setCart = function (cart) {
    state.cart = Object.assign(
      { createdAt: Date.now(), expiresAt: Date.now() + BX.CONFIG.holdMinutes * 60000 },
      cart
    );
    S.save();
    return state.cart;
  };
  S.cart = function () {
    const c = state.cart;
    if (!c) return null;
    if (Date.now() > c.expiresAt) { state.cart = null; S.save(); return null; }
    return c;
  };
  S.extendCart = function (minutes) {
    if (!state.cart) return null;
    state.cart.expiresAt = Date.now() + minutes * 60000;
    S.save();
    return state.cart;
  };
  S.clearCart = function () { state.cart = null; S.save(); };

  /* ---------- Órdenes ---------- */
  S.orders = function (userId) {
    const list = userId ? state.orders.filter((o) => o.userId === userId) : state.orders;
    return list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  S.order = function (id) { return state.orders.find((o) => o.id === id) || null; };

  S.placeOrder = function (payload) {
    const u = S.session();
    if (!u) return { ok: false, error: "Necesitas iniciar sesión para completar la compra." };
    const ev = S.event(payload.eventId);
    const z = S.zone(ev, payload.zoneId);
    if (!z) return { ok: false, error: "La zona seleccionada ya no está disponible." };
    if (z.capacity - z.sold < payload.qty) {
      return { ok: false, error: "Se agotaron los lugares en esa zona mientras completabas el pago." };
    }
    const allowed = S.remainingAllowance(u.id, ev.id);
    if (payload.qty > allowed) {
      return { ok: false, error: "Límite de " + BX.CONFIG.maxTicketsPerAccount + " boletos por cuenta en este evento. Te quedan " + allowed + "." };
    }

    state.counter += 1;
    const id = "BX-2026-" + String(state.counter).padStart(4, "0");
    const b = BX.breakdown(payload.unitPrice, payload.qty);
    const order = {
      id: id,
      userId: u.id,
      eventId: ev.id,
      zoneId: z.id,
      qty: payload.qty,
      seats: payload.seats || null,
      unitPrice: payload.unitPrice,
      subtotal: b.subtotal,
      fee: b.fee,
      iva: b.iva,
      total: b.total,
      method: payload.method,
      status: "pagada",
      createdAt: new Date().toISOString().slice(0, 16),
      tickets: Array.from({ length: payload.qty }, function (_, i) {
        return {
          id: id + "-T" + (i + 1),
          code: BX.ticketCode(id, i),
          seat: payload.seats ? payload.seats[i] : null,
          status: "valida",
          holder: null,
          usedAt: null,
        };
      }),
    };
    z.sold += payload.qty;
    ev.sold += payload.qty;
    state.orders.push(order);
    state.cart = null;
    state.queue = null;
    S.save();
    return { ok: true, order: order };
  };

  /* ---------- Reembolso autoservicio ---------- */
  S.canRefund = function (order) {
    if (order.status !== "pagada") return { ok: false, why: "Esta orden ya no admite reembolso." };
    const ev = S.event(order.eventId);
    if (!ev) return { ok: false, why: "Evento no disponible." };
    const hrs = (new Date(ev.date) - Date.now()) / 3600000;
    if (hrs < BX.CONFIG.refundHoursBefore) {
      return { ok: false, why: "La ventana de reembolso cierra " + BX.CONFIG.refundHoursBefore + " horas antes del evento." };
    }
    return { ok: true };
  };
  S.refund = function (orderId, reason) {
    const o = S.order(orderId);
    if (!o) return { ok: false, error: "Orden no encontrada." };
    const chk = S.canRefund(o);
    if (!chk.ok) return { ok: false, error: chk.why };
    o.status = "reembolsada";
    o.tickets.forEach((t) => { t.status = "cancelada"; });
    const ev = S.event(o.eventId);
    const z = S.zone(ev, o.zoneId);
    if (z) { z.sold = Math.max(0, z.sold - o.qty); ev.sold = Math.max(0, ev.sold - o.qty); }
    const rf = {
      id: "RF-" + Math.floor(1200 + Math.random() * 800),
      orderId: o.id,
      userId: o.userId,
      amount: o.total,
      reason: reason || "Solicitud del titular",
      status: "en proceso",
      openedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + BX.CONFIG.refundSlaHours * 3600000).toISOString(),
      closedAt: null,
    };
    state.refunds.push(rf);
    S.save();
    return { ok: true, refund: rf };
  };
  S.refundsOf = function (userId) { return state.refunds.filter((r) => r.userId === userId); };

  /* ---------- Transferencia de boletos ---------- */
  S.transfer = function (orderId, ticketId, toEmail, toName) {
    const o = S.order(orderId);
    if (!o) return { ok: false, error: "Orden no encontrada." };
    const t = o.tickets.find((x) => x.id === ticketId);
    if (!t) return { ok: false, error: "Boleto no encontrado." };
    if (t.status !== "valida") return { ok: false, error: "Sólo se pueden transferir boletos vigentes." };
    t.status = "transferida";
    t.holder = { name: toName, email: toEmail, at: new Date().toISOString() };
    t.code = BX.ticketCode(orderId + toEmail, Math.floor(Math.random() * 90)); // el código anterior muere
    state.transfers.push({
      id: "TR-" + Math.floor(4000 + Math.random() * 5000),
      orderId: orderId, ticketId: ticketId,
      from: o.userId, toEmail: toEmail, toName: toName,
      at: new Date().toISOString(),
    });
    S.save();
    return { ok: true, ticket: t };
  };

  /* ---------- Reventa justa ---------- */
  S.resale = function () { return state.resale; };
  S.listForResale = function (orderId, qty, reason) {
    const o = S.order(orderId);
    if (!o) return { ok: false, error: "Orden no encontrada." };
    if (o.status !== "pagada") return { ok: false, error: "Esta orden no se puede publicar." };
    const u = S.session();
    const item = {
      id: "r" + Math.random().toString(36).slice(2, 7),
      eventId: o.eventId,
      zoneId: o.zoneId,
      price: o.unitPrice,            // tope duro: precio original
      originalPrice: o.unitPrice,
      sellerName: u ? u.name.split(" ")[0] + " " + (u.name.split(" ")[1] || "").charAt(0) + "." : "Usuario",
      sellerId: u ? u.id : null,
      orderId: orderId,
      qty: qty,
      listedAt: new Date().toISOString(),
      reason: reason || "Cambio de planes",
    };
    state.resale.unshift(item);
    o.status = "en reventa";
    S.save();
    return { ok: true, listing: item };
  };
  S.cancelListing = function (listingId) {
    const i = state.resale.findIndex((r) => r.id === listingId);
    if (i < 0) return { ok: false };
    const l = state.resale[i];
    if (l.orderId) { const o = S.order(l.orderId); if (o) o.status = "pagada"; }
    state.resale.splice(i, 1);
    S.save();
    return { ok: true };
  };

  /* ---------- Alertas de preventa ---------- */
  S.watch = function (eventId) {
    const u = S.session();
    const key = (u ? u.id : "anon") + ":" + eventId;
    const i = state.waitlist.indexOf(key);
    if (i >= 0) state.waitlist.splice(i, 1); else state.waitlist.push(key);
    S.save();
    return state.waitlist.indexOf(key) >= 0;
  };
  S.isWatching = function (eventId) {
    const u = S.session();
    return state.waitlist.indexOf((u ? u.id : "anon") + ":" + eventId) >= 0;
  };

  /* ---------- Validación en puerta ---------- */
  S.findTicketByCode = function (code) {
    const c = String(code).trim().toUpperCase();
    for (const o of state.orders) {
      for (const t of o.tickets) {
        if (t.code.toUpperCase() === c) return { order: o, ticket: t };
      }
    }
    return null;
  };
  S.scan = function (code, gate) {
    const found = S.findTicketByCode(code);
    const at = new Date().toISOString();
    let result;
    if (!found) {
      result = { status: "invalido", label: "Código no existe", detail: "Este código no corresponde a ningún boleto emitido por Boletix." };
    } else if (found.ticket.status === "usada") {
      result = { status: "duplicado", label: "Ya utilizado", detail: "Ingresó a las " + new Date(found.ticket.usedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) + ". Enviar a taquilla." };
    } else if (found.ticket.status === "cancelada") {
      result = { status: "cancelado", label: "Boleto reembolsado", detail: "La orden fue reembolsada. El acceso está anulado." };
    } else {
      found.ticket.status = "usada";
      found.ticket.usedAt = at;
      const ev = S.event(found.order.eventId);
      const z = S.zone(ev, found.order.zoneId);
      result = {
        status: "valido", label: "Acceso autorizado",
        detail: ev.title + " · " + z.name + (found.ticket.seat ? " · " + found.ticket.seat : ""),
      };
    }
    state.scans.unshift({ code: code, at: at, gate: gate || "Puerta A", status: result.status, label: result.label });
    if (state.scans.length > 60) state.scans.length = 60;
    S.save();
    return Object.assign(result, found || {});
  };
  S.scans = function () { return state.scans; };

  /* ---------- Panel del promotor ---------- */
  S.eventsOfPromoter = function (promoterId) {
    return state.events.filter((e) => e.promoterId === promoterId);
  };
  S.ordersOfEvent = function (eventId) {
    return state.orders.filter((o) => o.eventId === eventId);
  };
  S.revenueOfEvent = function (eventId) {
    const ev = S.event(eventId);
    if (!ev) return { gross: 0, fee: 0, net: 0, tickets: 0 };
    const gross = ev.zones.reduce((s, z) => s + z.price * z.sold, 0);
    const fee = Math.round(gross * BX.CONFIG.serviceFeeRate * 100) / 100;
    return { gross: gross, fee: fee, net: Math.round((gross - fee) * 100) / 100, tickets: ev.sold };
  };
  S.createEvent = function (data) {
    const venue = S.venue(data.venueId);
    const zones = BX.zoneTemplate(venue.layout, Number(data.base)).map(function (z) {
      return Object.assign({}, z, { price: Math.round(z.price / 10) * 10, sold: 0 });
    });
    const ev = {
      id: "e" + Math.random().toString(36).slice(2, 6),
      title: data.title,
      subtitle: data.subtitle || "",
      category: data.category,
      venueId: data.venueId,
      promoterId: data.promoterId,
      date: data.date,
      doorsMinutes: 60,
      palette: data.palette || "rosa",
      tags: (data.tags || "").split(",").map((s) => s.trim()).filter(Boolean),
      minAge: Number(data.minAge) || 0,
      lineup: (data.lineup || "").split(",").map((s) => s.trim()).filter(Boolean),
      about: data.about || "",
      zones: zones,
      capacity: zones.reduce((s, z) => s + z.capacity, 0),
      sold: 0,
      featured: false, trending: false, lowStock: false, past: false,
      status: "en revisión",
      dynamicPricing: false, priceLocked: true,
      createdAt: new Date().toISOString().slice(0, 16),
    };
    state.events.push(ev);
    S.save();
    return ev;
  };
  S.setEventStatus = function (eventId, status) {
    const e = S.event(eventId);
    if (e) { e.status = status; S.save(); }
    return e;
  };

  /* ---------- Panel de administración ---------- */
  S.pending = function () { return state.pending; };
  S.resolvePending = function (id, decision) {
    const i = state.pending.findIndex((p) => p.id === id);
    if (i < 0) return null;
    const p = state.pending.splice(i, 1)[0];
    if (decision === "aprobado") {
      const venue = S.venue(p.venueId);
      const zones = BX.zoneTemplate(venue.layout, p.base).map((z) => Object.assign({}, z, { price: Math.round(z.price / 10) * 10, sold: 0 }));
      state.events.push({
        id: "e" + Math.random().toString(36).slice(2, 6),
        title: p.title, subtitle: "", category: "conciertos",
        venueId: p.venueId, promoterId: p.promoterId, date: p.date,
        doorsMinutes: 60, palette: "violeta", tags: [], minAge: 18, lineup: [],
        about: "Evento aprobado desde el panel de administración.",
        zones: zones, capacity: zones.reduce((s, z) => s + z.capacity, 0), sold: 0,
        featured: false, trending: false, lowStock: false, past: false,
        status: "publicado", dynamicPricing: false, priceLocked: true,
        createdAt: new Date().toISOString().slice(0, 16),
      });
    }
    S.save();
    return p;
  };
  S.incidents = function () { return state.incidents; };
  S.resolveIncident = function (id) {
    const inc = state.incidents.find((x) => x.id === id);
    if (inc) { inc.status = "resuelto"; S.save(); }
    return inc;
  };
  S.users = function () { return state.users; };
  S.platformStats = function () {
    const evs = state.events.filter((e) => !e.past);
    const gross = state.events.reduce(
      (s, e) => s + e.zones.reduce((a, z) => a + z.price * z.sold, 0), 0
    );
    const fee = gross * BX.CONFIG.serviceFeeRate;
    const tickets = state.events.reduce((s, e) => s + e.sold, 0);
    return {
      gross: gross,
      fee: fee,
      tickets: tickets,
      liveEvents: evs.length,
      users: state.users.length,
      promoters: BX.PROMOTERS.length,
      openIncidents: state.incidents.filter((i) => i.status === "abierto").length,
      pending: state.pending.length,
      refundsOpen: state.refunds.filter((r) => r.status === "en proceso").length,
      avgFill: Math.round((state.events.reduce((s, e) => s + e.sold / e.capacity, 0) / state.events.length) * 100),
    };
  };
})();
