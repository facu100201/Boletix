/* BOLETIX — Explorar eventos */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui, S = BX.store;

  const state = {
    q: UI.param("q") || "",
    cat: UI.param("cat") || "",
    venue: "",
    alcaldia: "",
    when: "",          // hoy | semana | mes
    maxPrice: 0,
    accessible: false,
    sort: UI.param("orden") || "fecha",
    cuando: UI.param("cuando") || "",   // filtro rápido de fecha ("fin de semana", etc.)
    genre: UI.param("genero") || "",    // etiqueta de género elegida en "Por género"
    near: false,                        // "Cerca de mí" activo
    coords: null,                       // { lat, lng } una vez que el navegador la comparte
  };

  const $q = document.getElementById("q");
  const $grid = document.getElementById("ex-grid");
  const $count = document.getElementById("ex-count");
  const $empty = document.getElementById("ex-empty");
  const $sort = document.getElementById("ex-sort");
  $q.value = state.q;
  $sort.value = state.sort;

  /* ---------- Chips de categoría ---------- */
  function renderCats() {
    document.getElementById("ex-cats").innerHTML =
      '<button class="chip' + (state.cat === "" ? " is-on" : "") + '" data-cat="">Todo</button>' +
      BX.CATEGORIES.map(function (c) {
        return '<button class="chip' + (state.cat === c.id ? " is-on" : "") + '" data-cat="' + c.id + '">' +
          UI.icon(c.icon, 15) + c.name + "</button>";
      }).join("");
  }
  document.getElementById("ex-cats").addEventListener("click", function (e) {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    state.cat = b.dataset.cat;
    renderCats(); render();
  });

  /* ---------- Filtros rápidos ---------- */
  function topGenres() {
    const freq = new Map();
    S.upcoming().forEach((ev) => ev.tags.forEach((tg) => freq.set(tg, (freq.get(tg) || 0) + 1)));
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map((e) => e[0]);
  }
  function renderQuick() {
    document.getElementById("ex-quick").innerHTML =
      '<button class="chip' + (state.cuando === "fin de semana" ? " is-on" : "") + '" data-quick="finde" aria-pressed="' + (state.cuando === "fin de semana") + '">' +
      UI.icon("calendar", 14) + "Este fin de semana</button>" +
      '<button class="chip' + (state.maxPrice === 500 ? " is-on" : "") + '" data-quick="price500" aria-pressed="' + (state.maxPrice === 500) + '">' +
      UI.icon("tag", 14) + "Menos de $500</button>" +
      '<button class="chip' + (state.near ? " is-on" : "") + '" data-quick="near" aria-pressed="' + state.near + '">' +
      UI.icon("pin", 14) + (state.near ? "Cerca de mí ✓" : "Cerca de mí") + "</button>" +
      '<div style="position:relative;display:inline-flex">' +
      '<button class="chip' + (state.genre ? " is-on" : "") + '" id="ex-genre-btn" aria-haspopup="true" aria-expanded="false">' +
      UI.icon("music", 14) + (state.genre ? "#" + state.genre : "Por género") + "</button>" +
      '<div class="card no-reveal hide" id="ex-genre-menu" role="menu" style="position:absolute;left:0;top:calc(100% + 8px);z-index:70;padding:var(--s2);width:200px;max-height:260px;overflow-y:auto"></div>' +
      "</div>";
  }
  function toggleNear() {
    if (state.near) { state.near = false; state.coords = null; renderQuick(); render(); return; }
    if (!navigator.geolocation) { UI.toast("Tu navegador no comparte ubicación.", "err"); return; }
    UI.toast("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(function (pos) {
      state.near = true;
      state.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderQuick(); render();
      UI.toast("Ordenado por cercanía", "ok");
    }, function () {
      UI.toast("No pudimos usar tu ubicación. Revisa el permiso del navegador.", "err");
    }, { timeout: 8000 });
  }
  document.getElementById("ex-quick").addEventListener("click", function (e) {
    const genreItem = e.target.closest("[data-genre]");
    if (genreItem) {
      state.genre = genreItem.dataset.genre;
      document.getElementById("ex-genre-menu").classList.add("hide");
      renderQuick(); render();
      return;
    }
    const genreBtn = e.target.closest("#ex-genre-btn");
    if (genreBtn) {
      const menu = document.getElementById("ex-genre-menu");
      const genres = topGenres();
      menu.innerHTML = (state.genre ? '<button class="side-item" data-genre="">' + UI.icon("x", 15) + "Quitar filtro</button>" : "") +
        genres.map((g) => '<button class="side-item' + (state.genre === g ? " is-active" : "") + '" data-genre="' + g + '">#' + UI.esc(g) + "</button>").join("");
      const open = !menu.classList.contains("hide");
      menu.classList.toggle("hide");
      genreBtn.setAttribute("aria-expanded", String(!open));
      return;
    }
    const b = e.target.closest("[data-quick]");
    if (!b) return;
    const k = b.dataset.quick;
    if (k === "finde") { state.cuando = state.cuando === "fin de semana" ? "" : "fin de semana"; renderQuick(); render(); }
    else if (k === "price500") { state.maxPrice = state.maxPrice === 500 ? 0 : 500; renderQuick(); render(); }
    else if (k === "near") toggleNear();
  });
  document.addEventListener("click", function (e) {
    const menu = document.getElementById("ex-genre-menu");
    const btn = document.getElementById("ex-genre-btn");
    if (menu && !menu.classList.contains("hide") && !e.target.closest("#ex-genre-btn") && !e.target.closest("#ex-genre-menu")) {
      menu.classList.add("hide");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Búsqueda ---------- */
  let t;
  $q.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () { state.q = $q.value.trim(); render(); }, 180);
  });
  UI.attachSearchAutocomplete(document.getElementById("ex-search"), {
    onSelect: function (item) {
      if (item.type === "event") { location.href = "evento.html?id=" + item.event.id; return; }
      if (item.type === "venue") { $q.value = item.venue.name; state.q = item.venue.name; render(); return; }
      if (item.type === "date") { state.cuando = item.word; $q.value = ""; state.q = ""; renderQuick(); render(); return; }
    },
  });
  document.getElementById("ex-search").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("ex-clear").innerHTML = UI.icon("x", 17);
  document.getElementById("ex-clear").addEventListener("click", function () {
    $q.value = ""; state.q = ""; render(); $q.focus();
  });
  $sort.addEventListener("change", function () { state.sort = $sort.value; render(); });

  /* ---------- Panel de filtros (hoja inferior en móvil) ---------- */
  function activeFilterCount() {
    let n = 0;
    if (state.venue) n++;
    if (state.alcaldia) n++;
    if (state.when) n++;
    if (state.maxPrice) n++;
    if (state.accessible) n++;
    return n;
  }
  function updateFilterButton() {
    const n = activeFilterCount();
    document.getElementById("ex-filtercount").innerHTML =
      UI.icon("filter", 16) + " Filtros" + (n ? ' <span class="badge badge-rosa">' + n + "</span>" : "");
  }

  document.getElementById("ex-openfilters").addEventListener("click", function () {
    const alcaldias = Array.from(new Set(BX.VENUES.map((v) => v.alcaldia))).sort();
    const html =
      '<div class="stack stack-4">' +
      '<div class="field"><label class="label" for="f-when">Cuándo</label>' +
      '<select class="select" id="f-when">' +
      '<option value="">Cualquier fecha</option>' +
      '<option value="semana">Próximos 7 días</option>' +
      '<option value="mes">Próximos 30 días</option>' +
      '<option value="trimestre">Próximos 3 meses</option>' +
      "</select></div>" +
      '<div class="field"><label class="label" for="f-venue">Recinto</label>' +
      '<select class="select" id="f-venue"><option value="">Todos los recintos</option>' +
      BX.VENUES.map((v) => '<option value="' + v.id + '">' + UI.esc(v.name) + "</option>").join("") +
      "</select></div>" +
      '<div class="field"><label class="label" for="f-alc">Alcaldía</label>' +
      '<select class="select" id="f-alc"><option value="">Toda la ciudad</option>' +
      alcaldias.map((a) => '<option value="' + a + '">' + a + "</option>").join("") +
      "</select></div>" +
      '<div class="field"><label class="label" for="f-price">Precio total máximo: <span class="mono" id="f-price-out"></span></label>' +
      '<input class="input" type="range" id="f-price" min="0" max="6000" step="100" style="padding:0;min-height:auto">' +
      '<span class="hint">Considera el precio final con comisión e IVA incluidos.</span></div>' +
      '<label class="check"><input type="checkbox" id="f-acc"> <span>Sólo eventos con zona accesible para silla de ruedas</span></label>' +
      "</div>";

    const m = UI.modal({
      title: "Filtrar cartelera",
      body: html,
      actions: [
        {
          label: "Limpiar", variant: "btn-ghost", onClick: function () {
            state.venue = ""; state.alcaldia = ""; state.when = ""; state.maxPrice = 0; state.accessible = false;
            updateFilterButton(); render();
          }
        },
        {
          label: "Aplicar", variant: "btn-primary", onClick: function (body) {
            state.when = body.querySelector("#f-when").value;
            state.venue = body.querySelector("#f-venue").value;
            state.alcaldia = body.querySelector("#f-alc").value;
            state.maxPrice = Number(body.querySelector("#f-price").value);
            state.accessible = body.querySelector("#f-acc").checked;
            updateFilterButton(); render();
          }
        },
      ],
    });
    m.body.querySelector("#f-when").value = state.when;
    m.body.querySelector("#f-venue").value = state.venue;
    m.body.querySelector("#f-alc").value = state.alcaldia;
    m.body.querySelector("#f-acc").checked = state.accessible;
    const range = m.body.querySelector("#f-price");
    const out = m.body.querySelector("#f-price-out");
    range.value = state.maxPrice || 0;
    function syncRange() { out.textContent = Number(range.value) === 0 ? "sin límite" : UI.money(range.value); }
    range.addEventListener("input", syncRange);
    syncRange();
  });

  /* ---------- Filtrado ---------- */
  function matches(ev) {
    const venue = S.venue(ev.venueId);
    if (state.cat && ev.category !== state.cat) return false;
    if (state.venue && ev.venueId !== state.venue) return false;
    if (state.alcaldia && venue.alcaldia !== state.alcaldia) return false;
    if (state.accessible && !ev.zones.some((z) => z.accessible)) return false;

    if (state.maxPrice) {
      if (BX.ptr(S.minPrice(ev)) > state.maxPrice) return false;
    }
    if (state.when) {
      const days = { semana: 7, mes: 30, trimestre: 92 }[state.when];
      const diff = (new Date(ev.date) - Date.now()) / 86400000;
      if (diff > days) return false;
    }
    if (state.cuando) {
      const pred = UI.dateGroupPredicate(state.cuando);
      if (pred && !pred(ev)) return false;
    }
    if (state.genre && ev.tags.indexOf(state.genre) < 0) return false;
    if (state.q) {
      const hay = [ev.title, ev.subtitle, venue.name, venue.alcaldia, ev.tags.join(" "), ev.lineup.join(" "), ev.about]
        .join(" ").toLowerCase();
      const terms = state.q.toLowerCase().split(/\s+/);
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  }

  function sortList(list) {
    if (state.near && state.coords) {
      return list.sort((a, b) => {
        const va = S.venue(a.venueId), vb = S.venue(b.venueId);
        return S.distanceKm(state.coords.lat, state.coords.lng, va.lat, va.lng) -
          S.distanceKm(state.coords.lat, state.coords.lng, vb.lat, vb.lng);
      });
    }
    const by = {
      fecha: (a, b) => new Date(a.date) - new Date(b.date),
      populares: (a, b) => b.sold / b.capacity - a.sold / a.capacity,
      "precio-asc": (a, b) => S.minPrice(a) - S.minPrice(b),
      "precio-desc": (a, b) => S.maxPrice(b) - S.maxPrice(a),
      nuevos: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    };
    return list.sort(by[state.sort] || by.fecha);
  }

  function render() {
    const list = sortList(S.upcoming().filter(matches));
    $grid.innerHTML = list.map(UI.eventCard).join("");
    $count.textContent = list.length === 0
      ? ""
      : list.length + (list.length === 1 ? " evento encontrado" : " eventos encontrados");
    $empty.innerHTML = list.length ? "" :
      '<div class="empty"><div class="empty-mark">' + UI.icon("search", 24) + "</div>" +
      "<h3>Nada coincide con esa combinación</h3>" +
      '<p class="txt-2 t-sm" style="max-width:44ch">Prueba con menos filtros o busca por el nombre del recinto. También puedes avisarnos qué buscabas para conseguirlo.</p>' +
      '<button class="btn btn-ghost btn-sm" id="ex-reset">Quitar todos los filtros</button></div>';
    const rb = document.getElementById("ex-reset");
    if (rb) rb.addEventListener("click", function () {
      state.q = ""; state.cat = ""; state.venue = ""; state.alcaldia = "";
      state.when = ""; state.maxPrice = 0; state.accessible = false;
      state.cuando = ""; state.genre = ""; state.near = false; state.coords = null;
      $q.value = ""; renderCats(); renderQuick(); updateFilterButton(); render();
    });
    UI.revealAll($grid);
    UI.hydratePosters($grid);

    const url = new URL(location.href);
    url.search = "";
    if (state.q) url.searchParams.set("q", state.q);
    if (state.cat) url.searchParams.set("cat", state.cat);
    if (state.sort !== "fecha") url.searchParams.set("orden", state.sort);
    if (state.cuando) url.searchParams.set("cuando", state.cuando);
    if (state.genre) url.searchParams.set("genero", state.genre);
    history.replaceState(null, "", url);
  }

  renderCats();
  renderQuick();
  updateFilterButton();
  render();
})();
