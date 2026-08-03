/* ============================================================
   BOLETIX — Semilla de datos (dummy, sin base de datos)
   Todo vive aquí y se hidrata a localStorage en el primer arranque.
   ============================================================ */
(function () {
  "use strict";
  const BX = (window.BX = window.BX || {});

  /* ---------- Parámetros de negocio ---------- */
  BX.CONFIG = {
    serviceFeeRate: 0.07,      // Tarifa plana Boletix (7%)
    ivaRate: 0.16,             // IVA aplicado sólo sobre la comisión
    competitorFeeRate: 0.20,   // Referencia de mercado para el comparador
    maxTicketsPerAccount: 6,   // Tope anti-bots por cuenta y evento
    holdMinutes: 10,           // Congelamiento de asientos en checkout
    refundHoursBefore: 48,     // Ventana de reembolso autoservicio
    refundSlaHours: 72,        // Compromiso de devolución de dinero
    resaleCapRate: 1.00,       // Reventa topada al 100% del valor original
    qrRotateSeconds: 15,       // Rotación del QR dinámico
    currency: "MXN",
  };

  /* ---------- Categorías ---------- */
  BX.CATEGORIES = [
    { id: "conciertos",   name: "Conciertos",   icon: "music" },
    { id: "festivales",   name: "Festivales",   icon: "flame" },
    { id: "standup",      name: "Stand-Up",     icon: "mic" },
    { id: "teatro",       name: "Teatro",       icon: "masks" },
    { id: "deportes",     name: "Deportes",     icon: "trophy" },
    { id: "conferencias", name: "Conferencias", icon: "slides" },
    { id: "danza",        name: "Danza y Ópera",icon: "note" },
    { id: "familiares",   name: "Familiares",   icon: "star" },
  ];

  /* ---------- Recintos de mediana escala en CDMX ---------- */
  BX.VENUES = [
    { id: "v01", name: "Teatro Metropólitan",   alcaldia: "Cuauhtémoc",       address: "Independencia 90, Centro",            capacity: 3165, layout: "teatro",  metro: "Juárez / Balderas" },
    { id: "v02", name: "Auditorio BlackBerry",  alcaldia: "Cuauhtémoc",       address: "Av. Chapultepec 56, Juárez",          capacity: 2500, layout: "general", metro: "Cuauhtémoc" },
    { id: "v03", name: "El Plaza Condesa",      alcaldia: "Cuauhtémoc",       address: "Juan Escutia 4, Condesa",             capacity: 1800, layout: "general", metro: "Chapultepec" },
    { id: "v04", name: "Lunario",               alcaldia: "Miguel Hidalgo",   address: "Paseo de la Reforma 50, Polanco",     capacity: 1000, layout: "mesas",   metro: "Auditorio" },
    { id: "v05", name: "Foro Indie Rocks!",     alcaldia: "Cuauhtémoc",       address: "Zacatecas 39, Roma Norte",            capacity: 400,  layout: "general", metro: "Hospital General" },
    { id: "v06", name: "Teatro de la Ciudad",   alcaldia: "Cuauhtémoc",       address: "Donceles 36, Centro Histórico",       capacity: 1300, layout: "teatro",  metro: "Allende" },
    { id: "v07", name: "Frontón México",        alcaldia: "Cuauhtémoc",       address: "Plaza de la República 17, Tabacalera",capacity: 2200, layout: "general", metro: "Revolución" },
    { id: "v08", name: "Teatro Insurgentes",    alcaldia: "Benito Juárez",    address: "Av. Insurgentes Sur 1587, San José",  capacity: 1100, layout: "teatro",  metro: "Barranca del Muerto" },
    { id: "v09", name: "Parque Bicentenario",   alcaldia: "Azcapotzalco",     address: "Av. 5 de Mayo 290, Nueva El Rosario", capacity: 12000,layout: "campo",   metro: "Refinería" },
    { id: "v10", name: "Centro Cultural Roma",  alcaldia: "Cuauhtémoc",       address: "Orizaba 122, Roma Norte",             capacity: 260,  layout: "general", metro: "Insurgentes" },
    { id: "v11", name: "Deportivo Xochimilco",  alcaldia: "Xochimilco",       address: "Prol. División del Norte s/n",        capacity: 4500, layout: "campo",   metro: "Xochimilco (TL)" },
    { id: "v12", name: "Sala Nezahualcóyotl",   alcaldia: "Coyoacán",         address: "Insurgentes Sur 3000, C.U.",          capacity: 2300, layout: "teatro",  metro: "C.U." },
  ];

  /* ---------- Promotores (clientes B2B) ---------- */
  BX.PROMOTERS = [
    { id: "p01", name: "Indie Live MX",        rfc: "ILM240115AB3", verified: true,  since: "2024-01-15", contact: "Renata Salas",   payout: "BBVA ••4471", rating: 4.8 },
    { id: "p02", name: "Colectivo Nocturno",   rfc: "CNO230802KL9", verified: true,  since: "2023-08-02", contact: "Iván Beltrán",   payout: "Banorte ••2210", rating: 4.6 },
    { id: "p03", name: "Risa Producciones",    rfc: "RPR250310MN4", verified: true,  since: "2025-03-10", contact: "Ana Karen L.",   payout: "Santander ••8890", rating: 4.9 },
    { id: "p04", name: "Escena Independiente", rfc: "EIN251120QQ1", verified: false, since: "2025-11-20", contact: "Frida Escamilla",payout: "STP ••0034", rating: 4.2 },
    { id: "p05", name: "Cancha Norte Deportes",rfc: "CND240605TT7", verified: true,  since: "2024-06-05", contact: "Pamela Ruíz V.", payout: "BBVA ••1188", rating: 4.5 },
  ];

  /* ---------- Paletas de póster (generadas en canvas) ---------- */
  const PAL = {
    rosa:   ["#2a0616", "#ff2d6f", "#ffb020"],
    ambar:  ["#2a1a02", "#ffb020", "#ff2d6f"],
    jade:   ["#032018", "#17c98b", "#d9ff6b"],
    violeta:["#150a2e", "#8b5cf6", "#22d3ee"],
    cobre:  ["#2b0f06", "#ff7a3d", "#ffd166"],
    azul:   ["#04182b", "#2f86ff", "#8ef7ff"],
    vino:   ["#22040f", "#d61f5c", "#ff9ec4"],
    lima:   ["#12200a", "#a3e635", "#22d3ee"],
  };
  BX.PALETTES = PAL;

  /* ---------- Plantillas de zonas por tipo de recinto ---------- */
  function zonasTeatro(p) {
    return [
      { id: "z1", name: "Luneta Preferente", color: "#ff2d6f", price: p * 1.55, capacity: 240, sold: 0, seated: true, rows: 8,  perRow: 30 },
      { id: "z2", name: "Luneta",            color: "#ffb020", price: p * 1.15, capacity: 300, sold: 0, seated: true, rows: 10, perRow: 30 },
      { id: "z3", name: "Primer Piso",       color: "#8b5cf6", price: p * 0.85, capacity: 210, sold: 0, seated: true, rows: 7,  perRow: 30 },
      { id: "z4", name: "Segundo Piso",      color: "#17c98b", price: p * 0.60, capacity: 180, sold: 0, seated: true, rows: 6,  perRow: 30 },
    ];
  }
  function zonasGeneral(p) {
    return [
      { id: "z1", name: "Front Stage",   color: "#ff2d6f", price: p * 1.60, capacity: 200, sold: 0, seated: false },
      { id: "z2", name: "General A",     color: "#ffb020", price: p * 1.00, capacity: 600, sold: 0, seated: false },
      { id: "z3", name: "General B",     color: "#8b5cf6", price: p * 0.75, capacity: 500, sold: 0, seated: false },
    ];
  }
  function zonasMesas(p) {
    return [
      { id: "z1", name: "Mesa VIP (4 lugares)", color: "#ff2d6f", price: p * 2.20, capacity: 80,  sold: 0, seated: true, rows: 4, perRow: 20 },
      { id: "z2", name: "Mesa Central",         color: "#ffb020", price: p * 1.40, capacity: 160, sold: 0, seated: true, rows: 8, perRow: 20 },
      { id: "z3", name: "Balcón",               color: "#17c98b", price: p * 0.90, capacity: 200, sold: 0, seated: false },
    ];
  }
  function zonasCampo(p) {
    return [
      { id: "z1", name: "Golden Pit",  color: "#ff2d6f", price: p * 2.00, capacity: 500,  sold: 0, seated: false },
      { id: "z2", name: "General",     color: "#ffb020", price: p * 1.00, capacity: 3000, sold: 0, seated: false },
      { id: "z3", name: "Gradas",      color: "#8b5cf6", price: p * 0.70, capacity: 1200, sold: 0, seated: true, rows: 10, perRow: 40 },
      { id: "z4", name: "Accesible",   color: "#17c98b", price: p * 0.70, capacity: 60,   sold: 0, seated: false, accessible: true },
    ];
  }
  BX.zoneTemplate = function (layout, p) {
    if (layout === "teatro") return zonasTeatro(p);
    if (layout === "mesas") return zonasMesas(p);
    if (layout === "campo") return zonasCampo(p);
    return zonasGeneral(p);
  };

  /* ---------- Eventos ---------- */
  // sold se define como porcentaje inicial para simular venta previa.
  const RAW_EVENTS = [
    {
      id: "e01", title: "Siberia Nocturna", subtitle: "Gira Ecos del Norte 2026",
      cat: "conciertos", venue: "v02", promoter: "p01", date: "2026-08-14T21:00",
      base: 780, pal: "violeta", tags: ["indie", "rock", "gira"], minAge: 15,
      lineup: ["Siberia Nocturna", "Los Grises", "Mora & Vera"],
      about: "Después de dos años sin tocar en la capital, Siberia Nocturna regresa con la gira que presenta su tercer disco. Set de 100 minutos con la banda completa y dos invitados sorpresa por noche.",
      soldPct: [0.72, 0.55, 0.31], featured: true, trending: true,
    },
    {
      id: "e02", title: "Karla Beltrán", subtitle: "Sin Filtro — Comedia en Vivo",
      cat: "standup", venue: "v01", promoter: "p03", date: "2026-08-22T20:30",
      base: 650, pal: "ambar", tags: ["comedia", "stand-up"], minAge: 18,
      lineup: ["Karla Beltrán", "Telonero: Beto Ríos"],
      about: "Material completamente nuevo. Noventa minutos sobre volver a vivir con tu mamá a los 34 años, la gentrificación de la Roma y por qué nadie contesta el teléfono.",
      soldPct: [0.88, 0.64, 0.42, 0.20], featured: true, trending: true,
    },
    {
      id: "e03", title: "Festival Raíz Urbana", subtitle: "Edición VII — 2 escenarios, 18 actos",
      cat: "festivales", venue: "v09", promoter: "p02", date: "2026-09-05T14:00",
      base: 1250, pal: "lima", tags: ["festival", "cumbia", "hip hop", "electrónica"], minAge: 18,
      lineup: ["Sonora Dínamo", "MC Chapopote", "Lucía Ferro", "Trópico Falso", "Bandera Roja", "Kilómetro Cero", "+12 más"],
      about: "Dos escenarios, doce horas, dieciocho actos entre cumbia experimental, hip hop nacional y electrónica de raíz. Zona de comida de mercado y área de descanso con sombra.",
      soldPct: [0.61, 0.44, 0.28, 0.10], featured: true, trending: true,
    },
    {
      id: "e04", title: "La Casa de Bernarda Alba", subtitle: "Compañía Nacional de Teatro",
      cat: "teatro", venue: "v06", promoter: "p04", date: "2026-08-09T19:00",
      base: 480, pal: "vino", tags: ["clásico", "drama"], minAge: 12,
      lineup: ["Dir. Mariana Quiroz", "Elenco de 9 actrices"],
      about: "Montaje de la obra de Lorca situado en un pueblo del Bajío en 1971. Temporada limitada de ocho funciones.",
      soldPct: [0.45, 0.33, 0.19, 0.08], featured: false,
    },
    {
      id: "e05", title: "Nadie Duerme", subtitle: "Presentación de disco debut",
      cat: "conciertos", venue: "v05", promoter: "p01", date: "2026-08-01T21:30",
      base: 320, pal: "rosa", tags: ["indie", "debut", "local"], minAge: 18,
      lineup: ["Nadie Duerme", "Vidrio Templado"],
      about: "Presentación oficial del primer disco. Foro chico, sonido grande. Los primeros 50 boletos incluyen vinilo firmado.",
      soldPct: [0.94, 0.81, 0.55], featured: false, trending: true, lowStock: true,
    },
    {
      id: "e06", title: "Tigres del Valle vs. Halcones CDMX", subtitle: "Jornada 12 — Liga Nacional de Baloncesto",
      cat: "deportes", venue: "v07", promoter: "p05", date: "2026-08-16T18:00",
      base: 420, pal: "azul", tags: ["baloncesto", "liga"], minAge: 0,
      lineup: ["Tigres del Valle", "Halcones CDMX"],
      about: "Duelo directo por el liderato de la conferencia. Apertura de puertas 90 minutos antes con zona de actividades para menores.",
      soldPct: [0.38, 0.52, 0.24], featured: false,
    },
    {
      id: "e07", title: "Cumbre Producto MX 2026", subtitle: "Dos días de producto, diseño y datos",
      cat: "conferencias", venue: "v04", promoter: "p04", date: "2026-09-17T09:00",
      base: 2400, pal: "jade", tags: ["tech", "producto", "networking"], minAge: 16,
      lineup: ["24 ponentes", "6 talleres", "Sesión de portafolios"],
      about: "El encuentro de producto digital más grande del país. Incluye comida, materiales y acceso a las grabaciones por 90 días.",
      soldPct: [0.29, 0.41, 0.15], featured: false,
    },
    {
      id: "e08", title: "Orquesta de Cámara del Centro", subtitle: "Programa Schubert / Revueltas",
      cat: "danza", venue: "v12", promoter: "p04", date: "2026-08-28T20:00",
      base: 390, pal: "cobre", tags: ["clásica", "orquesta"], minAge: 8,
      lineup: ["Dir. Héctor Amaya", "Solista: Julia Pardo, violonchelo"],
      about: "Sinfonía Inacabada de Schubert y Sensemayá de Revueltas en un mismo programa. Charla previa gratuita a las 19:00.",
      soldPct: [0.34, 0.27, 0.18, 0.09], featured: false,
    },
    {
      id: "e09", title: "Mora & Vera", subtitle: "Acústico íntimo — dos funciones",
      cat: "conciertos", venue: "v10", promoter: "p01", date: "2026-08-07T20:00",
      base: 550, pal: "rosa", tags: ["acústico", "aforo limitado"], minAge: 15,
      lineup: ["Mora & Vera"],
      about: "Formato de sala con 260 lugares. Sin amplificación pesada, sin pantallas, sin celulares: los teléfonos se guardan en bolsa sellada al entrar.",
      soldPct: [0.97, 0.90, 0.72], featured: false, lowStock: true,
    },
    {
      id: "e10", title: "Noche de Improvisación", subtitle: "Temporada permanente — martes",
      cat: "standup", venue: "v05", promoter: "p03", date: "2026-08-04T21:00",
      base: 280, pal: "ambar", tags: ["improvisación", "comedia"], minAge: 16,
      lineup: ["Compañía Sin Guion", "Invitado sorpresa"],
      about: "Todo se decide con lo que el público grita. Nunca se repite una función. Cada boleto incluye una bebida de la casa.",
      soldPct: [0.55, 0.40, 0.22], featured: false,
    },
    {
      id: "e11", title: "Trópico Falso", subtitle: "Baile de fin de gira",
      cat: "conciertos", venue: "v03", promoter: "p02", date: "2026-09-12T22:00",
      base: 690, pal: "lima", tags: ["cumbia", "baile", "fin de gira"], minAge: 18,
      lineup: ["Trópico Falso", "DJ Perla Negra"],
      about: "Última fecha de la gira de 42 ciudades. Set extendido de dos horas y DJ hasta las 3 de la mañana.",
      soldPct: [0.66, 0.49, 0.30], featured: true, trending: true,
    },
    {
      id: "e12", title: "El Principito", subtitle: "Versión familiar con títeres",
      cat: "familiares", venue: "v08", promoter: "p04", date: "2026-08-23T12:00",
      base: 350, pal: "cobre", tags: ["familiar", "títeres", "matiné"], minAge: 0,
      lineup: ["Teatro de Muñecos La Rueda"],
      about: "Adaptación de 65 minutos sin intermedio, pensada para público desde 4 años. Función con intérprete de LSM.",
      soldPct: [0.41, 0.36, 0.22, 0.11], featured: false,
    },
    {
      id: "e13", title: "Bandera Roja", subtitle: "20 años — concierto aniversario",
      cat: "conciertos", venue: "v01", promoter: "p02", date: "2026-10-03T21:00",
      base: 950, pal: "vino", tags: ["rock", "aniversario"], minAge: 15,
      lineup: ["Bandera Roja", "Ex integrantes invitados"],
      about: "Dos décadas de la banda con el disco Cenizas tocado íntegro y una segunda parte de grandes éxitos.",
      soldPct: [0.51, 0.38, 0.25, 0.14], featured: true,
    },
    {
      id: "e14", title: "Maratón de Danza Contemporánea", subtitle: "8 compañías, una noche",
      cat: "danza", venue: "v06", promoter: "p04", date: "2026-09-26T19:30",
      base: 300, pal: "violeta", tags: ["danza", "contemporáneo"], minAge: 12,
      lineup: ["8 compañías independientes"],
      about: "Ocho piezas breves de compañías emergentes con votación del público al final de la noche.",
      soldPct: [0.22, 0.19, 0.12, 0.06], featured: false,
    },
    {
      id: "e15", title: "Copa Xochimilco de Fútbol 7", subtitle: "Final y tercer lugar",
      cat: "deportes", venue: "v11", promoter: "p05", date: "2026-08-30T16:00",
      base: 180, pal: "jade", tags: ["fútbol", "final", "comunitario"], minAge: 0,
      lineup: ["4 equipos finalistas"],
      about: "Cierre del torneo comunitario con 128 equipos inscritos. Entrada libre para menores de 12 años acompañados.",
      soldPct: [0.30, 0.44, 0.18, 0.05], featured: false,
    },
    {
      id: "e16", title: "Lucía Ferro", subtitle: "Rito — show audiovisual",
      cat: "conciertos", venue: "v07", promoter: "p01", date: "2026-10-17T21:00",
      base: 880, pal: "azul", tags: ["electrónica", "audiovisual"], minAge: 18,
      lineup: ["Lucía Ferro", "Visuales: Estudio Cardume"],
      about: "Show diseñado específicamente para este recinto: cuatro pantallas, sonido envolvente y una hora y media sin pausas.",
      soldPct: [0.44, 0.31, 0.19], featured: false, trending: true,
    },
    {
      id: "e17", title: "Cuentos para Dormir Despierto", subtitle: "Narración oral para adultos",
      cat: "teatro", venue: "v10", promoter: "p04", date: "2026-08-19T20:30",
      base: 260, pal: "cobre", tags: ["narración", "íntimo"], minAge: 16,
      lineup: ["Sara Montiel-Rojas"],
      about: "Noventa minutos de narración oral a la luz de velas para 90 personas. Incluye mezcal de bienvenida.",
      soldPct: [0.78, 0.62, 0.40], featured: false, lowStock: true,
    },
    {
      id: "e18", title: "Sonora Dínamo", subtitle: "Cumbia sinfónica",
      cat: "conciertos", venue: "v12", promoter: "p02", date: "2026-11-07T20:00",
      base: 740, pal: "rosa", tags: ["cumbia", "sinfónico"], minAge: 12,
      lineup: ["Sonora Dínamo", "Orquesta Sinfónica Juvenil"],
      about: "Los arreglos clásicos de la sonora tocados con 60 músicos en escena. Función única.",
      soldPct: [0.35, 0.28, 0.16, 0.08], featured: false,
    },
    {
      id: "e19", title: "Mercado de Arte Editorial", subtitle: "Feria de fanzine y libro de artista",
      cat: "festivales", venue: "v10", promoter: "p04", date: "2026-09-19T11:00",
      base: 120, pal: "lima", tags: ["feria", "editorial", "arte"], minAge: 0,
      lineup: ["80 editoriales independientes", "6 charlas"],
      about: "Ochenta editoriales independientes, talleres de encuadernación y charlas de diseño editorial durante todo el día.",
      soldPct: [0.18, 0.12, 0.09], featured: false,
    },
    {
      id: "e20", title: "MC Chapopote", subtitle: "Concreto — presentación de álbum",
      cat: "conciertos", venue: "v03", promoter: "p02", date: "2026-09-28T21:00",
      base: 620, pal: "ambar", tags: ["hip hop", "presentación"], minAge: 16,
      lineup: ["MC Chapopote", "DJ Cortina", "Invitados"],
      about: "Presentación del cuarto álbum con banda en vivo, sección de metales y cuatro invitados por confirmar.",
      soldPct: [0.58, 0.42, 0.26], featured: false, trending: true,
    },
    /* --- Eventos pasados, para historial y reportes --- */
    {
      id: "e90", title: "Los Grises", subtitle: "Invierno en la Ciudad",
      cat: "conciertos", venue: "v03", promoter: "p01", date: "2026-05-16T21:00",
      base: 540, pal: "azul", tags: ["indie"], minAge: 15, lineup: ["Los Grises"],
      about: "Fecha agotada de la gira de invierno.", soldPct: [1, 1, 0.98], past: true,
    },
    {
      id: "e91", title: "Karla Beltrán", subtitle: "Sin Filtro — función piloto",
      cat: "standup", venue: "v05", promoter: "p03", date: "2026-04-11T21:00",
      base: 380, pal: "ambar", tags: ["comedia"], minAge: 18, lineup: ["Karla Beltrán"],
      about: "Función piloto donde se probó el material nuevo.", soldPct: [1, 0.96, 0.90], past: true,
    },
  ];

  /* ---------- Construcción de eventos completos ---------- */
  BX.buildEvents = function () {
    return RAW_EVENTS.map(function (r) {
      const venue = BX.VENUES.find((v) => v.id === r.venue);
      const zones = BX.zoneTemplate(venue.layout, r.base).map(function (z, i) {
        const pct = (r.soldPct && r.soldPct[i] != null) ? r.soldPct[i] : 0.25;
        return Object.assign({}, z, {
          price: Math.round(z.price / 10) * 10,
          sold: Math.round(z.capacity * pct),
        });
      });
      const cap = zones.reduce((s, z) => s + z.capacity, 0);
      const sold = zones.reduce((s, z) => s + z.sold, 0);
      return {
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        category: r.cat,
        venueId: r.venue,
        promoterId: r.promoter,
        date: r.date,
        doorsMinutes: 60,
        palette: r.pal,
        tags: r.tags || [],
        minAge: r.minAge || 0,
        lineup: r.lineup || [],
        about: r.about,
        zones: zones,
        capacity: cap,
        sold: sold,
        featured: !!r.featured,
        trending: !!r.trending,
        lowStock: !!r.lowStock,
        past: !!r.past,
        status: r.past ? "finalizado" : "publicado",
        dynamicPricing: false,     // Compromiso de marca: nunca
        priceLocked: true,         // El precio de la fila es el precio final
        createdAt: "2026-06-01T10:00",
      };
    });
  };

  /* ---------- Usuarios precargados ---------- */
  BX.USERS = [
    {
      id: "u_fan", role: "fan", name: "María Fernanda Ríos", email: "fan@boletix.mx", password: "boletix123",
      phone: "55 1234 5678", birth: "1996-04-12", createdAt: "2026-02-03",
      cards: [{ id: "c1", brand: "Visa", last4: "4242", exp: "09/29", holder: "M F RIOS" }],
      follows: ["Siberia Nocturna", "Karla Beltrán", "Trópico Falso"],
      prefs: { alerts: true, newsletter: true, accessibility: false },
    },
    {
      id: "u_new", role: "fan", name: "Diego Lara", email: "nuevo@boletix.mx", password: "boletix123",
      phone: "55 8765 4321", birth: "2001-11-30", createdAt: "2026-07-25",
      cards: [], follows: [], prefs: { alerts: true, newsletter: false, accessibility: false },
    },
    {
      id: "u_promo", role: "promotor", name: "Renata Salas", email: "promotor@boletix.mx", password: "boletix123",
      promoterId: "p01", phone: "55 2211 9090", createdAt: "2024-01-15",
      cards: [], follows: [], prefs: { alerts: true, newsletter: true, accessibility: false },
    },
    {
      id: "u_admin", role: "admin", name: "Fernando Acuña", email: "admin@boletix.mx", password: "boletix123",
      phone: "55 4400 1122", createdAt: "2025-09-01",
      cards: [], follows: [], prefs: { alerts: false, newsletter: false, accessibility: false },
    },
    {
      id: "u_staff", role: "staff", name: "Control de Acceso — Puerta A", email: "staff@boletix.mx", password: "boletix123",
      venueId: "v02", createdAt: "2026-01-20",
      cards: [], follows: [], prefs: { alerts: false, newsletter: false, accessibility: false },
    },
  ];

  /* ---------- Órdenes precargadas de María Fernanda ---------- */
  BX.buildOrders = function (events) {
    function ev(id) { return events.find((e) => e.id === id); }
    function mk(id, userId, eventId, zoneId, qty, when, status, seats) {
      const e = ev(eventId);
      const z = e.zones.find((x) => x.id === zoneId);
      const b = BX.breakdown(z.price, qty);
      return {
        id: id,
        userId: userId,
        eventId: eventId,
        zoneId: zoneId,
        qty: qty,
        seats: seats || null,
        unitPrice: z.price,
        subtotal: b.subtotal,
        fee: b.fee,
        iva: b.iva,
        total: b.total,
        method: "Visa ••4242",
        status: status,           // pagada | usada | reembolsada | transferida
        createdAt: when,
        tickets: Array.from({ length: qty }, function (_, i) {
          return {
            id: id + "-T" + (i + 1),
            code: BX.ticketCode(id, i),
            seat: seats ? seats[i] : null,
            status: status === "usada" ? "usada" : "valida",
            holder: null,
            usedAt: status === "usada" ? when : null,
          };
        }),
      };
    }
    return [
      mk("BX-2026-0741", "u_fan", "e01", "z1", 2, "2026-06-18T13:22", "pagada"),
      mk("BX-2026-0912", "u_fan", "e02", "z2", 3, "2026-07-02T20:05", "pagada"),
      mk("BX-2026-0388", "u_fan", "e90", "z2", 2, "2026-04-28T11:40", "usada"),
      mk("BX-2026-0405", "u_fan", "e91", "z1", 1, "2026-03-15T18:10", "reembolsada"),
      mk("BX-2026-1002", "u_fan", "e05", "z2", 2, "2026-07-20T09:15", "pagada"),
    ];
  };

  /* ---------- Reventa justa (tope al precio original) ---------- */
  BX.buildResale = function (events) {
    return [
      { id: "r01", eventId: "e01", zoneId: "z2", price: null, sellerName: "Alejandra M.", qty: 2, listedAt: "2026-07-21T14:00", reason: "Cambio de planes" },
      { id: "r02", eventId: "e03", zoneId: "z1", price: null, sellerName: "Rodrigo C.", qty: 1, listedAt: "2026-07-24T09:30", reason: "Ya no puedo asistir" },
      { id: "r03", eventId: "e05", zoneId: "z1", price: null, sellerName: "Paulina V.", qty: 2, listedAt: "2026-07-26T19:45", reason: "Compré duplicado" },
      { id: "r04", eventId: "e11", zoneId: "z2", price: null, sellerName: "Hugo T.", qty: 4, listedAt: "2026-07-27T22:10", reason: "Se canceló el viaje" },
      { id: "r05", eventId: "e02", zoneId: "z1", price: null, sellerName: "Nadia R.", qty: 1, listedAt: "2026-07-28T08:20", reason: "Cambio de planes" },
    ].map(function (r) {
      const e = events.find((x) => x.id === r.eventId);
      const z = e.zones.find((x) => x.id === r.zoneId);
      r.price = z.price;                 // Tope: nunca por encima del valor original
      r.originalPrice = z.price;
      return r;
    });
  };

  /* ---------- Solicitudes de reembolso en curso ---------- */
  BX.REFUNDS = [
    { id: "RF-1181", orderId: "BX-2026-0405", userId: "u_fan", amount: 0, reason: "Cancelación del usuario", status: "completado", openedAt: "2026-03-18T10:00", closedAt: "2026-03-19T15:20" },
  ];

  /* ---------- Eventos pendientes de aprobación (cola del admin) ---------- */
  BX.PENDING_EVENTS = [
    { id: "pe01", title: "Sesión Techno Subterránea", promoterId: "p04", venueId: "v05", date: "2026-10-11T23:00", capacity: 400, base: 450, submitted: "2026-07-26T17:00", risk: "medio", note: "Promotor sin verificar. Falta comprobante de uso de recinto." },
    { id: "pe02", title: "Torneo Regional de Ajedrez", promoterId: "p05", venueId: "v04", date: "2026-09-06T10:00", capacity: 300, base: 150, submitted: "2026-07-27T11:30", risk: "bajo", note: "Documentación completa. Listo para aprobar." },
    { id: "pe03", title: "Fiesta de Fin de Verano", promoterId: "p04", venueId: "v11", date: "2026-08-31T20:00", capacity: 4500, base: 900, submitted: "2026-07-28T09:05", risk: "alto", note: "Aforo declarado supera permiso municipal cargado. Requiere revisión legal." },
  ];

  /* ---------- Reportes de fraude / incidencias ---------- */
  BX.INCIDENTS = [
    { id: "IN-330", type: "Intento de reventa externa", eventId: "e01", detail: "3 boletos publicados en marketplace externo a $4,200 c/u", severity: "alta", status: "abierto", at: "2026-07-27T22:41" },
    { id: "IN-331", type: "Actividad de bot bloqueada", eventId: "e03", detail: "412 solicitudes desde 9 IPs en 40s. Cuentas suspendidas.", severity: "media", status: "resuelto", at: "2026-07-26T10:02" },
    { id: "IN-332", type: "QR rechazado en puerta", eventId: "e90", detail: "Código ya utilizado a las 20:14. Portador redirigido a taquilla.", severity: "baja", status: "resuelto", at: "2026-05-16T20:31" },
    { id: "IN-333", type: "Promotor sin verificar", eventId: null, detail: "Escena Independiente subió evento sin permiso de recinto.", severity: "media", status: "abierto", at: "2026-07-28T09:10" },
  ];

  /* ---------- Dolores del mercado -> respuesta de Boletix ----------
     Base de la sección "Por qué Boletix" y del argumento de producto. */
  BX.PAIN_POINTS = [
    {
      id: "pp1", pain: "Cargos ocultos que aparecen hasta el último paso",
      evidence: "El precio anunciado se infla con cargos por servicio, gestión y entrega revelados en el checkout. Reguladores en Reino Unido y Canadá ya sancionaron esta práctica (drip pricing).",
      fix: "Precio Total Real. Cada cifra que ves en Boletix — buscador, tarjeta, mapa de asientos — ya incluye comisión e IVA. El desglose está a un toque, no escondido.",
      feature: "Precio Total Real", icon: "tag", where: "index.html#transparencia",
    },
    {
      id: "pp2", pain: "El precio sube mientras esperas en la fila virtual",
      evidence: "Usuarios reportan pasar una hora en fila y encontrar precios más altos al llegar al frente. La opacidad de la fila fue el reclamo central en la consulta pública británica del sector.",
      fix: "Fila con precio congelado. Al entrar a la fila se bloquea el precio que viste. Además mostramos tu posición real y el tiempo estimado, no una animación genérica.",
      feature: "Fila Transparente", icon: "queue", where: "paginas/transparencia.html#fila",
    },
    {
      id: "pp3", pain: "Boletos clonados: llegas y alguien ya entró con tu código",
      evidence: "La clonación de PDF estáticos es la modalidad de fraude que más creció en México; hay casos documentados de compradores legítimos dejados fuera del recinto.",
      fix: "QR dinámico que se regenera cada 15 segundos y sólo vive dentro de tu cuenta. Una captura de pantalla caduca antes de que puedas mandarla.",
      feature: "QR Dinámico", icon: "qr", where: "paginas/transparencia.html#qr",
    },
    {
      id: "pp4", pain: "Reventa con sobreprecios de hasta 400%",
      evidence: "Bots automatizados acaparan entre 15% y 30% del inventario en preventa y desplazan al público general hacia el mercado secundario.",
      fix: "Reventa Justa: si no puedes ir, revendes dentro de Boletix al precio original, nunca arriba. Tope duro, transferencia verificada y el comprador recibe un QR nuevo.",
      feature: "Reventa Justa", icon: "swap", where: "paginas/reventa.html",
    },
    {
      id: "pp5", pain: "Reembolsos negados o eternos, soporte que no responde",
      evidence: "Profeco registró 5,652 quejas en el mercado de venta de boletos entre 2022 y 2024; los acuerdos del sector plantean plazos de hasta 21 días naturales.",
      fix: "Reembolso en un toque hasta 48 horas antes del evento, sin llamadas ni formularios. Dinero de vuelta en 72 horas con reloj visible en tu cuenta.",
      feature: "Reembolso 1-Toque", icon: "back", where: "paginas/cuenta.html",
    },
    {
      id: "pp6", pain: "El sitio se cae justo cuando salen los boletos",
      evidence: "Se estima que más del 40% de los usuarios en filas virtuales de alta demanda sufre un error técnico que interrumpe la compra.",
      fix: "Si el pago falla, tu lugar en la fila y tus asientos quedan apartados 10 minutos con temporizador a la vista. No vuelves a formarte.",
      feature: "Carrito Blindado", icon: "shield", where: "paginas/transparencia.html#fila",
    },
    {
      id: "pp7", pain: "Precios dinámicos que cambian sin avisar",
      evidence: "El precio dinámico aplicado a boletos de conciertos detonó investigaciones de competencia en varios países durante 2024 y 2025.",
      fix: "Boletix no usa precios dinámicos. El precio publicado el día uno es el precio del último boleto. Lo firmamos por contrato con cada promotor.",
      feature: "Precio Fijo Garantizado", icon: "lock", where: "paginas/transparencia.html#precio",
    },
    {
      id: "pp8", pain: "Eventos falsos y páginas clonadas de boleteras",
      evidence: "La policía cibernética ha desactivado sitios que suplantan boleteras mexicanas; también hay reportes de eventos inexistentes publicados en plataformas reales.",
      fix: "Sello de Promotor Verificado con RFC validado y permiso de recinto en expediente. Sin sello, el evento no se publica ni cobra.",
      feature: "Promotor Verificado", icon: "check", where: "paginas/publica-tu-evento.html",
    },
    {
      id: "pp9", pain: "Sin señal en el recinto, el boleto no abre",
      evidence: "La dependencia de conexión en el acceso genera filas y pánico en la puerta, sobre todo en recintos saturados de red celular.",
      fix: "Tu boleto se guarda en el dispositivo. El QR sigue rotando y validando sin conexión; la app de puerta también opera offline y sincroniza después.",
      feature: "Boleto Offline", icon: "wifi", where: "paginas/transparencia.html#qr",
    },
  ];

  /* ---------- Utilidades de dinero ---------- */
  BX.breakdown = function (unitPrice, qty) {
    const C = BX.CONFIG;
    const subtotal = unitPrice * qty;
    const fee = Math.round(subtotal * C.serviceFeeRate * 100) / 100;
    const iva = Math.round(fee * C.ivaRate * 100) / 100;
    const total = Math.round((subtotal + fee + iva) * 100) / 100;
    const rival = Math.round(subtotal * (1 + C.competitorFeeRate * (1 + C.ivaRate)) * 100) / 100;
    return { subtotal, fee, iva, total, rival, savings: Math.round((rival - total) * 100) / 100 };
  };
  // Precio Total Real: lo que el usuario realmente paga por un boleto.
  BX.ptr = function (unitPrice) { return BX.breakdown(unitPrice, 1).total; };

  BX.ticketCode = function (orderId, i) {
    const s = (orderId + "-" + i).replace(/[^A-Z0-9]/gi, "").toUpperCase();
    let h = 0x811c9dc5;
    for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = (h * 0x01000193) >>> 0; }
    const raw = h.toString(36).toUpperCase().padStart(7, "0");
    return "BTX-" + raw.slice(0, 4) + "-" + raw.slice(4, 7) + (i + 1);
  };
})();
