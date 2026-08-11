/* ============================================================
   BOLETIX — Shell de la aplicación
   Barra superior, navegación inferior móvil, pie, tema y sesión.
   ============================================================ */
(function () {
  "use strict";
  const BX = window.BX;
  const UI = BX.ui;
  const S = BX.store;
  const App = (BX.app = {});

  /* ---------- Rutas ----------
     Todas las rutas se escriben relativas a la raíz del proyecto y se
     resuelven con UI.url, porque el shell se dibuja igual en index.html
     (raíz) que en las páginas de paginas/. */
  const P = (file) => UI.url("paginas/" + file);

  App.homeFor = function (user) {
    if (!user) return UI.url("index.html");
    if (user.role === "admin") return P("admin.html");
    if (user.role === "promotor") return P("promotor.html");
    if (user.role === "staff") return P("escaner.html");
    return P("cuenta.html");
  };

  App.requireAuth = function (roles) {
    const u = S.session();
    if (!u) {
      location.href = P("login.html") + "?next=" +
        encodeURIComponent(location.pathname.split("/").pop() + location.search);
      return null;
    }
    if (roles && roles.indexOf(u.role) < 0) {
      document.body.innerHTML =
        '<div class="wrap section"><div class="empty"><div class="empty-mark">' + UI.icon("lock", 24) + "</div>" +
        "<h2>Esta sección no es para tu cuenta</h2>" +
        '<p class="txt-2">Entraste como <strong>' + UI.esc(u.name) + "</strong> (" + u.role + "). " +
        "Cambia de cuenta para acceder al panel.</p>" +
        '<div class="row center" style="gap:var(--s2)"><a class="btn btn-primary" href="' + App.homeFor(u) + '">Ir a mi panel</a>' +
        '<a class="btn btn-ghost" href="' + P("login.html") + '">Cambiar de cuenta</a></div></div></div>';
      return null;
    }
    return u;
  };

  /* ---------- Tema claro / oscuro ----------
     Persistido en localStorage; el <head> de cada página ya aplicó el
     atributo antes del primer pintado (ver script inline), así que aquí
     solo hace falta reflejar el estado en el botón y manejar el click. */
  const THEME_KEY = "boletix.theme.v1";
  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function setTheme(t) {
    if (t === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try { window.localStorage.setItem(THEME_KEY, t); } catch (e) { /* modo privado: no persiste */ }
  }
  App.getTheme = getTheme;
  App.setTheme = setTheme;

  /* ---------- Barra superior ---------- */
  // file: se compara con la página actual para marcar el enlace activo.
  const NAV = [
    { file: "eventos.html", label: "Explorar" },
    { file: "reventa.html", label: "Reventa Justa" },
    { file: "transparencia.html", label: "Precios claros" },
    { file: "publica-tu-evento.html", label: "Publica tu evento" },
  ];

  function currentFile() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function buildHeader() {
    const here = currentFile();
    const u = S.session();
    const links = NAV.map(function (n) {
      return '<a class="nav-link' + (here === n.file ? " is-active" : "") +
        '" href="' + P(n.file) + '">' + n.label + "</a>";
    }).join("");

    let account;
    if (u) {
      const initials = u.name.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
      account =
        '<div style="position:relative">' +
        '<button class="avatar" id="bx-avatar" aria-label="Menú de cuenta" aria-expanded="false" style="border:0;cursor:pointer">' + initials + "</button>" +
        '<div id="bx-menu" class="card hide" style="position:absolute;right:0;top:calc(100% + 10px);width:230px;padding:var(--s2);box-shadow:var(--shadow-lg);z-index:80"></div>' +
        "</div>";
    } else {
      account =
        '<a class="btn btn-ghost btn-sm" href="' + P("login.html") + '" id="bx-enter">Entrar</a>' +
        '<a class="btn btn-primary btn-sm" href="' + P("registro.html") + '" id="bx-signup">Crear cuenta</a>';
    }

    const themeIcon = getTheme() === "light" ? "moon" : "sun";
    return (
      '<header class="nav"><div class="wrap nav-inner">' +
      '<a class="brand" href="' + UI.url("index.html") + '"><span class="brand-mark">B</span>Boletix</a>' +
      '<nav class="nav-links grow" aria-label="Principal">' + links + "</nav>" +
      '<div class="grow"></div>' +
      '<button class="btn btn-icon btn-plain" id="bx-theme" type="button" aria-label="Cambiar a tema ' +
      (getTheme() === "light" ? "oscuro" : "claro") + '">' + UI.icon(themeIcon, 18) + "</button>" +
      '<a class="btn btn-icon btn-plain" href="' + P("eventos.html") + '" aria-label="Buscar eventos">' + UI.icon("search", 19) + "</a>" +
      account +
      "</div></header>"
    );
  }

  function accountMenu(u) {
    const items = [];
    if (u.role === "fan") {
      items.push(["cuenta.html", "ticket", "Mis boletos"]);
      items.push(["cuenta.html#ordenes", "doc", "Mis compras"]);
      items.push(["cuenta.html#perfil", "user", "Mi perfil"]);
    }
    if (u.role === "promotor") {
      items.push(["promotor.html", "chart", "Panel del promotor"]);
      items.push(["promotor.html#nuevo", "plus", "Crear evento"]);
    }
    if (u.role === "admin") {
      items.push(["admin.html", "settings", "Administración"]);
      items.push(["escaner.html", "scan", "App de puerta"]);
    }
    if (u.role === "staff") items.push(["escaner.html", "scan", "App de puerta"]);
    items.push(["ayuda.html", "info", "Ayuda"]);

    return (
      '<div style="padding:var(--s2) var(--s3);border-bottom:1px solid var(--line);margin-bottom:var(--s1)">' +
      '<div style="font-weight:700;font-size:var(--t-sm)">' + UI.esc(u.name) + "</div>" +
      '<div class="t-xs txt-3">' + UI.esc(u.email) + "</div>" +
      "</div>" +
      items.map(function (i) {
        return '<a class="side-item" href="' + P(i[0]) + '" style="font-size:var(--t-sm)">' + UI.icon(i[1], 17) + i[2] + "</a>";
      }).join("") +
      '<button class="side-item" id="bx-logout" style="width:100%;font-size:var(--t-sm);color:var(--rojo)">' +
      UI.icon("logout", 17) + "Cerrar sesión</button>"
    );
  }

  /* ---------- Navegación inferior (móvil) ---------- */
  function buildTabbar() {
    const here = currentFile();
    const u = S.session();
    let tabs = [
      ["index.html", "home", "Inicio"],
      ["eventos.html", "grid", "Explorar"],
      ["reventa.html", "swap", "Reventa"],
    ];
    if (!u) tabs.push(["login.html", "user", "Entrar"]);
    else if (u.role === "fan") tabs.push(["cuenta.html", "ticket", "Mis boletos"]);
    else if (u.role === "promotor") tabs.push(["promotor.html", "chart", "Panel"]);
    else if (u.role === "admin") tabs.push(["admin.html", "settings", "Admin"]);
    else tabs.push(["escaner.html", "scan", "Puerta"]);

    return (
      '<nav class="tabbar" aria-label="Navegación principal">' +
      tabs.map(function (t) {
        const href = t[0] === "index.html" ? UI.url("index.html") : P(t[0]);
        return '<a class="tab' + (here === t[0] ? " is-active" : "") + '" href="' + href + '">' +
          UI.icon(t[1], 21) + "<span>" + t[2] + "</span></a>";
      }).join("") +
      "</nav>"
    );
  }

  /* ---------- Pie ---------- */
  // Cada liga lleva un ícono de flecha que solo aparece al pasar el
  // cursor (ver .foot-arrow en boletix.css) — un empujoncito sutil.
  function footLink(href, label) {
    return '<a href="' + href + '">' + UI.esc(label) + '<span class="foot-arrow">' + UI.icon("right", 13) + "</span></a>";
  }
  function buildFooter() {
    const cats = BX.CATEGORIES.slice(0, 5)
      .map((c) => footLink(P("eventos.html?cat=" + c.id), c.name)).join("");
    return (
      '<footer class="foot"><div class="wrap">' +
      '<div class="foot-grid">' +
      "<div>" +
      '<a class="brand" href="' + UI.url("index.html") + '" style="margin-bottom:var(--s3)"><span class="brand-mark">B</span>Boletix</a>' +
      '<p class="t-sm txt-2" style="max-width:34ch">La boletera justa: el precio que ves es el que pagas, tu boleto no se puede clonar y si no puedes ir, recuperas tu dinero.</p>' +
      '<div class="row" style="gap:var(--s2);margin-top:var(--s4);flex-wrap:wrap">' +
      '<span class="badge badge-jade">' + UI.icon("shield", 13) + " PCI-DSS v4.0</span>" +
      '<span class="badge">' + UI.icon("lock", 13) + " Datos cifrados</span>" +
      "</div></div>" +
      "<div><h5>" + UI.icon("star", 15) + "Descubre</h5>" + cats + footLink(P("eventos.html"), "Todos los eventos") + "</div>" +
      "<div><h5>" + UI.icon("shield", 15) + "Boletix</h5>" +
      footLink(P("transparencia.html"), "Cómo cobramos") +
      footLink(P("reventa.html"), "Reventa Justa") +
      footLink(P("publica-tu-evento.html"), "Publica tu evento") +
      footLink(P("ayuda.html"), "Centro de ayuda") + "</div>" +
      "<div><h5>" + UI.icon("doc", 15) + "Legal</h5>" +
      footLink(P("legal.html#terminos"), "Términos y condiciones") +
      footLink(P("legal.html#privacidad"), "Aviso de privacidad") +
      footLink(P("legal.html#reembolsos"), "Política de reembolsos") +
      footLink(P("ayuda.html#contacto"), "Contacto y quejas") + "</div>" +
      "</div>" +
      '<div class="foot-legal">' +
      "<span>Boletix S.A. de C.V. · Ciudad de México · Prototipo académico sin transacciones reales.</span>" +
      '<button type="button" class="foot-top" id="bx-totop">' + UI.icon("up", 14) + "Volver arriba</button>" +
      "<span>Comisión fija 7% + IVA. Sin precios dinámicos.</span>" +
      "</div></div></footer>"
    );
  }

  /* ---------- Montaje ---------- */
  function mount() {
    const headerSlot = document.getElementById("app-header");
    if (headerSlot) headerSlot.outerHTML = buildHeader();

    const footerSlot = document.getElementById("app-footer");
    if (footerSlot) footerSlot.outerHTML = buildFooter();

    const toTop = document.getElementById("bx-totop");
    if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    const themeBtn = document.getElementById("bx-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        const next = getTheme() === "light" ? "dark" : "light";
        setTheme(next);
        themeBtn.innerHTML = UI.icon(next === "light" ? "moon" : "sun", 18);
        themeBtn.setAttribute("aria-label", "Cambiar a tema " + (next === "light" ? "oscuro" : "claro"));
      });
    }

    if (!document.body.hasAttribute("data-no-tabbar")) {
      document.body.insertAdjacentHTML("beforeend", buildTabbar());
      document.body.classList.add("has-tabbar");
    }

    // Menú de cuenta
    const avatar = document.getElementById("bx-avatar");
    const menu = document.getElementById("bx-menu");
    if (avatar && menu) {
      const u = S.session();
      menu.innerHTML = accountMenu(u);
      avatar.addEventListener("click", function (e) {
        e.stopPropagation();
        const open = menu.classList.toggle("hide");
        avatar.setAttribute("aria-expanded", String(!open));
      });
      document.addEventListener("click", function () {
        menu.classList.add("hide");
        avatar.setAttribute("aria-expanded", "false");
      });
      menu.addEventListener("click", (e) => e.stopPropagation());
      const out = document.getElementById("bx-logout");
      if (out) out.addEventListener("click", function () {
        S.logout();
        UI.toast("Sesión cerrada");
        setTimeout(() => (location.href = UI.url("index.html")), 400);
      });
    }

    fillIconSlots(document);
    UI.hydratePosters();
    UI.revealAll();
    const hero = UI.$("canvas.hero-bg");
    if (hero) UI.paintHero(hero);

    // Nav: se eleva ligeramente al hacer scroll, en vez de quedar plana siempre.
    const navEl = UI.$(".nav");
    if (navEl) {
      const onScroll = function () { navEl.classList.toggle("is-scrolled", window.scrollY > 6); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  /* Los huecos de icono se dejan vacíos en el HTML y se llenan aquí,
     para no repetir rutas SVG en cada página. */
  const NOTE_ICON = {
    "note-jade": "check",
    "note-ambar": "alert",
    "note-rojo": "alert",
    "note-rosa": "info",
    "note-violeta": "shield",
  };
  function fillIconSlots(root) {
    UI.$$(".search-bar > span:empty", root).forEach(function (s) {
      s.innerHTML = UI.icon("search", 18);
      s.style.display = "inline-flex";
      s.setAttribute("aria-hidden", "true");
    });
    UI.$$(".note", root).forEach(function (note) {
      const slot = note.firstElementChild;
      if (!slot || slot.tagName !== "SPAN" || slot.innerHTML.trim()) return;
      let name = "info";
      for (const cls in NOTE_ICON) if (note.classList.contains(cls)) name = NOTE_ICON[cls];
      slot.innerHTML = UI.icon(name, 18);
      slot.style.display = "inline-flex";
      slot.setAttribute("aria-hidden", "true");
    });
  }
  App.fillIconSlots = fillIconSlots;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  /* ---------- Utilidad de demo: reiniciar datos ---------- */
  App.resetDemo = function () {
    UI.confirm(
      "Reiniciar la demostración",
      "Se borran las compras, reembolsos y eventos que creaste, y todo vuelve al estado inicial. Las cuentas precargadas no cambian.",
      "Reiniciar",
      function () {
        S.reset();
        UI.toast("Datos restaurados", "ok");
        setTimeout(() => (location.href = UI.url("index.html")), 500);
      },
      "btn-danger"
    );
  };
})();
