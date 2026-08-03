/* ============================================================
   BOLETIX — Utilidades de interfaz
   Formato, iconos, pósters generativos en canvas, QR dinámico,
   avisos y diálogos.
   ============================================================ */
(function () {
  "use strict";
  const BX = (window.BX = window.BX || {});
  const UI = (BX.ui = {});

  /* ---------- DOM ---------- */
  UI.$ = (sel, root) => (root || document).querySelector(sel);
  UI.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  UI.el = function (tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") n.className = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  };
  UI.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  };
  UI.param = function (name) { return new URLSearchParams(location.search).get(name); };

  /* ---------- Rutas ----------
     La raíz del sitio se deduce de la ruta de este script, no de la URL de la
     página. Así, un mismo componente compartido genera ligas correctas tanto
     desde index.html (raíz) como desde las páginas dentro de paginas/.
     Las rutas que se le pasan son siempre relativas a la raíz del proyecto. */
  UI.ROOT = (function () {
    const s = document.currentScript;
    if (s && s.src) return s.src.replace(/assets\/js\/core\/ui\.js.*$/, "");
    return "";
  })();
  UI.url = function (p) { return UI.ROOT + p; };

  /* ---------- Formato ---------- */
  const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const mxn2 = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  UI.money = (n) => mxn.format(Math.round(n || 0));
  UI.money2 = (n) => mxn2.format(n || 0);
  UI.compact = function (n) {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
    return "$" + Math.round(n);
  };
  UI.numf = (n) => new Intl.NumberFormat("es-MX").format(Math.round(n || 0));

  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  UI.dt = (s) => new Date(s);
  UI.dayShort = function (s) { const d = new Date(s); return DIAS[d.getDay()].toUpperCase(); };
  UI.dateShort = function (s) {
    const d = new Date(s);
    return DIAS[d.getDay()].toUpperCase() + " " + d.getDate() + " " + MESES[d.getMonth()].toUpperCase();
  };
  UI.dateLong = function (s) {
    const d = new Date(s);
    return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES_L[d.getMonth()] + ", " + d.getFullYear();
  };
  UI.time = function (s) {
    const d = new Date(s);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  UI.dateTime = (s) => UI.dateShort(s) + " · " + UI.time(s) + " h";
  UI.relative = function (s) {
    const diff = new Date(s) - Date.now();
    const abs = Math.abs(diff);
    const d = Math.round(abs / 86400000);
    const h = Math.round(abs / 3600000);
    const m = Math.round(abs / 60000);
    let txt;
    if (d >= 1) txt = d + (d === 1 ? " día" : " días");
    else if (h >= 1) txt = h + (h === 1 ? " hora" : " horas");
    else txt = Math.max(1, m) + " min";
    return diff >= 0 ? "en " + txt : "hace " + txt;
  };
  UI.clock = function (ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  };

  /* ---------- Iconos ---------- */
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    ticket: '<path d="M3 9V6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V15a3 3 0 0 0 0-6Z"/><path d="M15 5v14" stroke-dasharray="2 3"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    tag: '<path d="M3 12.5V4.5A1.5 1.5 0 0 1 4.5 3h8l8.5 8.5-9 9L3 12.5Z"/><circle cx="7.8" cy="7.8" r="1.4"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
    qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h3v3h-3zM20.5 14v3M17.5 20.5h3M14 20.5h.01"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    back: '<path d="M9 5 3.5 10.5 9 16"/><path d="M3.5 10.5H15a5.5 5.5 0 0 1 0 11h-3"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    wifi: '<path d="M2.5 8.5a15 15 0 0 1 19 0M6 12.5a10 10 0 0 1 12 0M9.5 16.5a5 5 0 0 1 5 0"/><circle cx="12" cy="20" r="1"/>',
    queue: '<circle cx="7" cy="7" r="2.5"/><circle cx="7" cy="17" r="2.5"/><path d="M12.5 7H21M12.5 17H21M7 9.5v5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0"/><path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 19.5a6.2 6.2 0 0 0-2-4.5"/>',
    alert: '<path d="M12 3.5 21 19H3l9-15.5Z"/><path d="M12 10v4M12 16.5h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"/>',
    logout: '<path d="M14.5 7V4.5h-10v15h10V17"/><path d="M10 12h11l-3-3M21 12l-3 3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z"/>',
    bell: '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    scan: '<path d="M3.5 8.5v-3a2 2 0 0 1 2-2h3M15.5 3.5h3a2 2 0 0 1 2 2v3M20.5 15.5v3a2 2 0 0 1-2 2h-3M8.5 20.5h-3a2 2 0 0 1-2-2v-3"/><path d="M3.5 12h17"/>',
    share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.3 10.8 7.4-4M8.3 13.2l7.4 4"/>',
    doc: '<path d="M6 3h7l5 5v13H6z"/><path d="M13 3v5h5M9 13h6M9 17h6"/>',
    music: '<circle cx="6.5" cy="17.5" r="2.8"/><circle cx="18" cy="15.5" r="2.8"/><path d="M9.3 17.5V6l11.5-2.5v12"/>',
    flame: '<path d="M12 21c3.6 0 6-2.4 6-5.6 0-4-3.4-5.4-3.4-8.4C14.6 4.5 12.8 3 12 3s.8 3-1.6 5.5C8.4 10.4 6 11.6 6 15.4 6 18.6 8.4 21 12 21Z"/>',
    mic: '<rect x="9" y="3" width="6" height="10.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
    masks: '<path d="M4 5h7v8a3.5 3.5 0 0 1-7 0V5Z"/><path d="M13 5h7v8a3.5 3.5 0 0 1-7 0V5Z"/><path d="M6.2 8.5h2.6M15.2 8.5h2.6"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5.5H4.5v1A3.5 3.5 0 0 0 8 10M17 5.5h2.5v1A3.5 3.5 0 0 1 16 10M9.5 20h5M12 14v6"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8.5 20h7"/>',
    note: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z"/>',
    left: '<path d="m14 5-7 7 7 7"/>',
    right: '<path d="m10 5 7 7-7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    seat: '<path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 10h16v6H4zM6 16v3M18 16v3"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  };
  UI.icon = function (name, size) {
    const d = P[name] || P.info;
    return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) +
      '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  };
  UI.iconEl = function (name, size) {
    const span = document.createElement("span");
    span.style.display = "inline-flex";
    span.innerHTML = UI.icon(name, size);
    return span.firstChild;
  };

  /* ---------- Ruido determinista ---------- */
  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function rng(seedStr) {
    let s = hash(seedStr) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  UI.hash = hash;

  /* ---------- Póster generativo ----------
     Cada evento produce un cartel reproducible: capas de tinta,
     retícula de puntos tipo risografía y una banda diagonal. */
  UI.paintPoster = function (canvas, event) {
    const pal = BX.PALETTES[event.palette] || BX.PALETTES.rosa;
    const rand = rng(event.id + event.title);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 400;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);

    // Fondo
    g.fillStyle = pal[0];
    g.fillRect(0, 0, w, h);

    // Manchas de tinta
    for (let i = 0; i < 4; i++) {
      const cx = rand() * w, cy = rand() * h;
      const r = (0.35 + rand() * 0.6) * Math.max(w, h);
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      const c = i % 2 === 0 ? pal[1] : pal[2];
      grad.addColorStop(0, c + "cc");
      grad.addColorStop(0.55, c + "33");
      grad.addColorStop(1, c + "00");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }

    // Banda diagonal
    g.save();
    g.translate(w * (0.1 + rand() * 0.5), h * (0.2 + rand() * 0.5));
    g.rotate((-35 + rand() * 70) * Math.PI / 180);
    g.globalAlpha = 0.22;
    g.fillStyle = pal[2];
    g.fillRect(-w, -h * 0.06, w * 3, h * 0.12);
    g.restore();

    // Retícula de medios tonos
    const step = Math.max(6, Math.round(w / 34));
    g.globalAlpha = 0.16;
    g.fillStyle = pal[2];
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const d = 1 - Math.min(1, Math.hypot(x - w * 0.5, y - h * 0.35) / (w * 0.85));
        const r = d * step * 0.34 * (0.5 + rand() * 0.8);
        if (r > 0.35) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      }
    }
    g.globalAlpha = 1;

    // Grano
    g.globalAlpha = 0.05;
    for (let i = 0; i < (w * h) / 220; i++) {
      g.fillStyle = rand() > 0.5 ? "#fff" : "#000";
      g.fillRect(rand() * w, rand() * h, 1.2, 1.2);
    }
    g.globalAlpha = 1;

    // Iniciales en gran formato
    const initials = event.title.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
    g.save();
    g.globalAlpha = 0.14;
    g.fillStyle = "#fff";
    g.font = "800 " + Math.round(h * 0.42) + "px 'Bricolage Grotesque', Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.translate(w * 0.5, h * 0.42);
    g.rotate(-0.04);
    g.fillText(initials, 0, 0);
    g.restore();

    // Viñeta inferior
    const vg = g.createLinearGradient(0, h * 0.45, 0, h);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(6,3,6,.72)");
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);
  };

  UI.posterHTML = function (event, opts) {
    opts = opts || {};
    const flags = [];
    if (event.lowStock) flags.push('<span class="badge badge-rojo">Últimos lugares</span>');
    else if (event.trending) flags.push('<span class="badge badge-ambar">En tendencia</span>');
    if (opts.flags) flags.push(opts.flags);
    return (
      '<div class="poster ' + (opts.ratio || "") + '" data-poster="' + event.id + '">' +
      "<canvas></canvas>" +
      (flags.length ? '<div class="poster-flag">' + flags.join("") + "</div>" : "") +
      (opts.title ? '<div class="poster-title">' + UI.esc(event.title) + "</div>" : "") +
      "</div>"
    );
  };

  UI.hydratePosters = function (root) {
    UI.$$("[data-poster]", root || document).forEach(function (node) {
      if (node.dataset.painted === "1") return;
      const ev = BX.store.event(node.dataset.poster);
      const cv = node.querySelector("canvas");
      if (!ev || !cv) return;
      requestAnimationFrame(function () {
        UI.paintPoster(cv, ev);
        node.dataset.painted = "1";
      });
    });
  };

  /* ---------- Fondo del hero ---------- */
  UI.paintHero = function (canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    const rand = rng("boletix-hero");
    g.clearRect(0, 0, w, h);
    const spots = [["#ff2d6f", 0.16, 0.28], ["#ffb020", 0.78, 0.12], ["#8b5cf6", 0.52, 0.68]];
    spots.forEach(function (s) {
      const cx = w * s[1], cy = h * s[2], r = Math.max(w, h) * 0.62;
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, s[0] + "55");
      grad.addColorStop(0.5, s[0] + "18");
      grad.addColorStop(1, s[0] + "00");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
    g.globalAlpha = 0.06;
    for (let i = 0; i < (w * h) / 400; i++) {
      g.fillStyle = "#fff";
      g.fillRect(rand() * w, rand() * h, 1.1, 1.1);
    }
  };

  /* ---------- Matriz visual de QR ----------
     Representación gráfica del token rotativo. No es un QR escaneable:
     la validación de este prototipo se hace por código alfanumérico. */
  UI.paintQR = function (canvas, token) {
    const N = 33;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth || 260;
    canvas.width = size * dpr; canvas.height = size * dpr;
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    const cell = size / N;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, size, size);
    g.fillStyle = "#0b0709";

    const rand = rng(token);
    const grid = [];
    for (let y = 0; y < N; y++) {
      grid[y] = [];
      for (let x = 0; x < N; x++) grid[y][x] = rand() > 0.52 ? 1 : 0;
    }
    // Zonas reservadas para los patrones de posición
    function clear(ox, oy) {
      for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) {
        const gy = oy + y, gx = ox + x;
        if (grid[gy] && grid[gy][gx] != null) grid[gy][gx] = 0;
      }
    }
    clear(0, 0); clear(N - 7, 0); clear(0, N - 7);

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (grid[y][x]) g.fillRect(x * cell, y * cell, cell + 0.4, cell + 0.4);
      }
    }
    // Patrones de posición
    function finder(ox, oy) {
      g.fillStyle = "#0b0709";
      g.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell);
      g.fillStyle = "#fff";
      g.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell);
      g.fillStyle = "#0b0709";
      g.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell);
    }
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    // Patrón de alineación
    g.fillStyle = "#0b0709";
    g.fillRect((N - 9) * cell, (N - 9) * cell, 5 * cell, 5 * cell);
    g.fillStyle = "#fff";
    g.fillRect((N - 8) * cell, (N - 8) * cell, 3 * cell, 3 * cell);
    g.fillStyle = "#0b0709";
    g.fillRect((N - 7) * cell, (N - 7) * cell, cell, cell);
  };

  /* ---------- Token rotativo ---------- */
  UI.rotatingToken = function (ticketCode) {
    const window_ = Math.floor(Date.now() / (BX.CONFIG.qrRotateSeconds * 1000));
    return ticketCode + "." + window_.toString(36).toUpperCase();
  };
  UI.tokenSecondsLeft = function () {
    const p = BX.CONFIG.qrRotateSeconds * 1000;
    return Math.ceil((p - (Date.now() % p)) / 1000);
  };

  /* ---------- Avisos ---------- */
  UI.toast = function (message, kind) {
    let host = UI.$(".toasts");
    if (!host) {
      host = UI.el("div", { class: "toasts", role: "status", "aria-live": "polite" });
      document.body.appendChild(host);
    }
    const t = UI.el("div", {
      class: "toast " + (kind === "ok" ? "toast-ok" : kind === "err" ? "toast-err" : ""),
      html: '<span style="flex:none;color:var(--' + (kind === "err" ? "rojo" : kind === "ok" ? "jade" : "accent") + ')">' +
        UI.icon(kind === "err" ? "alert" : kind === "ok" ? "check" : "info", 18) + "</span><span>" + UI.esc(message) + "</span>",
    });
    t.style.pointerEvents = "auto";
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .25s, transform .25s";
      t.style.opacity = "0";
      t.style.transform = "translateY(8px)";
      setTimeout(() => t.remove(), 260);
    }, 3400);
  };

  /* ---------- Diálogo ---------- */
  UI.modal = function (opts) {
    const back = UI.el("div", { class: "backdrop" });
    const box = UI.el("div", { class: "modal " + (opts.wide ? "modal-wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": opts.title || "Diálogo" });
    const head = UI.el("div", { class: "row between", style: "margin-bottom:var(--s4)" }, [
      UI.el("h3", { text: opts.title || "" }),
      UI.el("button", { class: "btn btn-icon btn-plain", "aria-label": "Cerrar", html: UI.icon("x", 20), onclick: close }),
    ]);
    box.appendChild(head);
    const body = UI.el("div", { class: "stack stack-4" });
    if (typeof opts.body === "string") body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    box.appendChild(body);

    if (opts.actions) {
      const bar = UI.el("div", { class: "row", style: "margin-top:var(--s5);gap:var(--s2)" });
      opts.actions.forEach(function (a) {
        bar.appendChild(UI.el("button", {
          class: "btn " + (a.variant || "btn-ghost") + (a.block === false ? "" : " grow"),
          text: a.label,
          onclick: function () { if (!a.onClick || a.onClick(body) !== false) close(); },
        }));
      });
      box.appendChild(bar);
    }
    back.appendChild(box);
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      document.removeEventListener("keydown", onKey);
      back.remove();
      document.body.style.overflow = "";
      if (opts.onClose) opts.onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
    document.body.style.overflow = "hidden";
    const focusable = box.querySelector("input, select, textarea, button.btn-primary");
    if (focusable) setTimeout(() => focusable.focus(), 60);
    return { close: close, body: body };
  };

  UI.confirm = function (title, message, confirmLabel, onYes, variant) {
    UI.modal({
      title: title,
      body: '<p class="txt-2">' + UI.esc(message) + "</p>",
      actions: [
        { label: "Cancelar", variant: "btn-ghost" },
        { label: confirmLabel || "Confirmar", variant: variant || "btn-primary", onClick: onYes },
      ],
    });
  };

  /* ---------- Tarjeta de evento ---------- */
  UI.eventCard = function (ev) {
    const venue = BX.store.venue(ev.venueId);
    const min = BX.ptr(BX.store.minPrice(ev));
    return (
      '<a class="ecard" href="' + UI.url("paginas/evento.html?id=" + ev.id) + '">' +
      UI.posterHTML(ev) +
      '<div class="ecard-body">' +
      '<span class="ecard-date">' + UI.dateShort(ev.date) + " · " + UI.time(ev.date) + "</span>" +
      '<span class="ecard-title">' + UI.esc(ev.title) + "</span>" +
      '<span class="ecard-venue">' + UI.esc(venue.name) + "</span>" +
      "</div>" +
      '<div class="ecard-foot">' +
      '<span class="ecard-price mono">' + UI.money(min) + "<small>total, ya con cargos</small></span>" +
      '<span class="txt-3">' + UI.icon("right", 16) + "</span>" +
      "</div></a>"
    );
  };

  /* ---------- Validación de tarjeta (Luhn) ---------- */
  UI.luhn = function (num) {
    const s = String(num).replace(/\D/g, "");
    if (s.length < 13) return false;
    let sum = 0, alt = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  };
  UI.cardBrand = function (num) {
    const s = String(num).replace(/\D/g, "");
    if (/^4/.test(s)) return "Visa";
    if (/^5[1-5]/.test(s) || /^2[2-7]/.test(s)) return "Mastercard";
    if (/^3[47]/.test(s)) return "American Express";
    return "Tarjeta";
  };
  UI.maskCard = function (v) {
    return String(v).replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };

  /* ---------- Repintado responsivo ---------- */
  let raf;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      UI.$$("[data-poster]").forEach((n) => { n.dataset.painted = "0"; });
      UI.hydratePosters();
      const hero = UI.$("canvas.hero-bg");
      if (hero) UI.paintHero(hero);
    });
  });
})();
