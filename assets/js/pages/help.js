/* BOLETIX — Centro de ayuda */
(function () {
  "use strict";
  const BX = window.BX, UI = BX.ui;
  const C = BX.CONFIG;

  /* ---------- Atajos ---------- */
  document.getElementById("hp-shortcuts").innerHTML = [
    ["ticket", "Abrir mi boleto", "cuenta.html"],
    ["back", "Pedir un reembolso", "cuenta.html#boletos"],
    ["swap", "Revender o transferir", "reventa.html"],
    ["doc", "Pedir factura", "#facturacion"],
  ].map(function (s) {
    return '<a class="card card-flat stack stack-2" href="' + s[2] + '" style="padding:var(--s3)">' +
      '<span style="color:var(--accent)">' + UI.icon(s[0], 20) + "</span>" +
      '<strong class="t-sm">' + s[1] + "</strong></a>";
  }).join("");

  /* ---------- Preguntas ---------- */
  const GROUPS = [
    {
      id: "compras", title: "Comprar boletos", items: [
        ["¿El precio que veo ya incluye todo?",
         "Sí. Cada cifra que aparece en Boletix —en el buscador, en la tarjeta del evento, en el mapa de asientos— ya trae nuestra comisión del 7% y el IVA correspondiente. En el checkout verás el mismo número, con el desglose a la vista. No existen conceptos de gestión, envío ni impresión."],
        ["¿Por qué hay un límite de " + C.maxTicketsPerAccount + " boletos por cuenta?",
         "Es un tope contra bots y acaparadores, no una táctica de escasez. Los programas automatizados llegan a llevarse entre 15% y 30% del inventario en preventa; el límite por cuenta les quita el negocio. Si necesitas más boletos para un grupo grande, escríbenos antes de la venta y lo resolvemos por la vía correcta."],
        ["¿Los precios suben si el evento se pone de moda?",
         "No. Boletix no usa precios dinámicos y lo prohíbe contractualmente a todos los promotores. El precio publicado el día uno es el precio del último boleto que se venda. Además, al entrar a la fila virtual tu precio queda congelado."],
        ["¿Qué pasa si el pago falla justo en la fila?",
         "Tus lugares quedan apartados " + C.holdMinutes + " minutos con el reloj a la vista, aunque el pago se caiga. Si el primer intento no pasa, puedes reintentar con otro método sin volver a formarte."],
        ["¿Qué formas de pago aceptan?",
         "Tarjeta de débito o crédito, transferencia SPEI con CLABE de un solo uso, PayPal, Mercado Pago y efectivo en tienda con referencia. Con efectivo el apartado dura 24 horas completas, no diez minutos. La tienda puede cobrar su propia comisión; esa no es nuestra y no la controlamos."],
      ]
    },
    {
      id: "boletos", title: "Mi boleto y el acceso", items: [
        ["¿Dónde está mi boleto en PDF?",
         "No existe, y es a propósito. Un PDF se puede copiar infinitas veces, y la clonación de códigos es hoy la modalidad de fraude que más crece: gente que compró legítimamente se queda afuera porque alguien más entró con el mismo código. Tu boleto vive en tu cuenta con un código que se regenera cada " + C.qrRotateSeconds + " segundos."],
        ["¿Funciona si no tengo señal en el recinto?",
         "Sí. La secuencia de códigos se guarda en tu dispositivo y sigue rotando sin internet. El lector de la puerta también valida offline y sincroniza cuando vuelve la señal. Una caída de la red del recinto no detiene la fila."],
        ["Se me acabó la batería. ¿Me quedo afuera?",
         "No. Cada boleto tiene un código de respaldo alfanumérico que el personal puede teclear manualmente. Está impreso en la vista de tu boleto, debajo del código gráfico. Aun así, llega con pila: es más rápido para todos."],
        ["¿Puedo entrar con captura de pantalla?",
         "No, y esa es exactamente la protección. Para cuando alcanzas a mandar la captura, el código ya cambió. Si quieres darle el boleto a alguien, usa la función de transferir: es instantánea, gratuita y segura."],
        ["¿Cómo transfiero un boleto a un amigo?",
         "Desde Mis boletos, botón Transferir. Escribes su nombre y correo y listo. En ese instante tu código se anula y la otra persona recibe uno nuevo a su nombre. Nadie puede entrar dos veces con el mismo boleto."],
      ]
    },
    {
      id: "reembolsos", title: "Reembolsos y cancelaciones", items: [
        ["¿Cómo pido un reembolso?",
         "Entra a Mis boletos y toca Reembolsar. Se confirma en la misma pantalla: sin llamadas, sin formulario de justificación y sin que alguien tenga que aprobarlo. Está disponible hasta " + C.refundHoursBefore + " horas antes del evento."],
        ["¿Cuánto tardan en devolverme el dinero?",
         "Un máximo de " + C.refundSlaHours + " horas, con el reloj visible en tu cuenta. Para dimensionarlo: los acuerdos del sector en México plantean plazos de hasta 21 días naturales."],
        ["¿Me devuelven también el cargo por servicio?",
         "Sí, completo. La mayoría de las plataformas retiene su comisión aunque te devuelva el boleto. Nos parece indefendible cobrar por un servicio que terminó en devolución."],
        ["¿Y si el evento se cancela o cambia de fecha?",
         "Reembolso automático al método original, sin que tengas que pedirlo, más un aviso por correo y notificación. Si sólo cambia la fecha, puedes conservar tu boleto para la nueva o pedir la devolución; tú decides."],
        ["Ya pasaron las " + C.refundHoursBefore + " horas. ¿Perdí mi dinero?",
         "No necesariamente. Puedes publicarlo en Reventa Justa hasta que empiece el evento y recuperar lo que pagaste. No cobramos comisión por revender."],
      ]
    },
    {
      id: "reventa", title: "Reventa Justa", items: [
        ["¿Puedo revender más caro?",
         "No, y no es sólo una regla en los términos: no existe interfaz para hacerlo. El campo de precio está fijado al valor original de tu compra y no es editable por nadie, ni por el promotor ni por nosotros."],
        ["¿Cuánto me cobran por revender?",
         "Nada. Recuperas exactamente lo que pagaste por el boleto. La comisión del 7% la paga quien compra, igual que en una venta normal."],
        ["Compré en reventa. ¿Cómo sé que el boleto es real?",
         "Porque la transferencia ocurre dentro de Boletix. El código del vendedor se anula en el mismo instante en que pagas y tú recibes uno nuevo a tu nombre. No hay forma de que alguien entre con el boleto que compraste."],
        ["Vi mi boleto publicado en otro sitio a triple precio. ¿Qué hago?",
         "Repórtalo desde el formulario de contacto con el tema Sospecha de fraude. Avisamos al titular y le damos 24 horas para retirarlo. Si no lo hace, anulamos el código y reembolsamos a quien lo haya comprado allá."],
      ]
    },
    {
      id: "cuenta", title: "Mi cuenta", items: [
        ["Olvidé mi contraseña",
         "En este prototipo todas las cuentas de demostración usan la contraseña boletix123. En producción recibirías una liga de un solo uso por correo, válida por 15 minutos."],
        ["¿Puedo llevarme mis datos o borrar mi cuenta?",
         "Sí, desde Mi perfil, sin escribir un correo ni esperar respuesta. Descargar tus datos genera un archivo con tu perfil, tus compras y tus reembolsos. Borrar la cuenta reembolsa automáticamente los boletos vigentes."],
        ["¿Venden mis datos?",
         "No. Compartimos con cada promotor los datos de compra de su propio evento, porque son de su evento, y nada más. No vendemos listas a terceros ni te mandamos publicidad de otras marcas."],
      ]
    },
    {
      id: "facturacion", title: "Facturación", items: [
        ["¿Cómo pido factura?",
         "Desde la pantalla de confirmación de tu compra o desde Mis compras, botón Solicitar factura. Llega a tu correo en menos de 24 horas."],
        ["¿Qué exactamente me facturan?",
         "Boletix factura únicamente su cargo por servicio más el IVA correspondiente. El importe del boleto lo factura el promotor del evento, porque es quien presta el servicio del espectáculo. En la confirmación te decimos cuál es cada monto."],
      ]
    },
    {
      id: "accesibilidad", title: "Accesibilidad", items: [
        ["¿Hay lugares para silla de ruedas?",
         "En los recintos que los tienen, sí, marcados como zona Accesible en el mapa. El acompañante entra sin costo adicional. Puedes filtrar la cartelera para ver sólo eventos con esta zona."],
        ["¿La página funciona con lector de pantalla?",
         "Los controles tienen etiquetas, el foco del teclado es visible y el plano de asientos es navegable con Tab y Enter. Si encuentras algo que no funciona con tu tecnología de asistencia, escríbenos: lo tratamos como error, no como sugerencia."],
      ]
    },
  ];

  function renderFaqs(filter) {
    const q = (filter || "").trim().toLowerCase();
    const host = document.getElementById("hp-faqs");
    let any = false;
    host.innerHTML = GROUPS.map(function (g) {
      const items = g.items.filter(function (it) {
        return !q || (it[0] + " " + it[1]).toLowerCase().indexOf(q) >= 0;
      });
      if (!items.length) return "";
      any = true;
      return '<section id="' + g.id + '" class="stack stack-2">' +
        '<h2 style="font-size:var(--t-lg)">' + g.title + "</h2>" +
        '<div class="card" style="padding:0 var(--s4)">' +
        items.map(function (it) {
          return '<details class="faq"' + (q ? " open" : "") + "><summary>" + UI.esc(it[0]) + "</summary>" +
            '<div class="faq-body">' + UI.esc(it[1]) + "</div></details>";
        }).join("") +
        "</div></section>";
    }).join("");

    if (!any) {
      host.innerHTML = '<div class="empty"><div class="empty-mark">' + UI.icon("search", 24) + "</div>" +
        "<h3>No encontramos eso</h3>" +
        '<p class="txt-2 t-sm" style="max-width:44ch">Escríbenos abajo y te contestamos. Si la pregunta se repite, la agregamos aquí.</p>' +
        '<a class="btn btn-primary btn-sm" href="#contacto">Ir al formulario</a></div>';
    }
  }

  const search = document.getElementById("hp-q");
  let t;
  search.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(() => renderFaqs(search.value), 160);
  });
  document.getElementById("hp-search").addEventListener("submit", (e) => e.preventDefault());
  renderFaqs("");

  /* ---------- Canales ---------- */
  document.getElementById("hp-channels").innerHTML = [
    ["mail", "Correo", "hola@boletix.mx", "Respuesta en menos de 6 horas hábiles. Si tu evento es hoy, ponlo en el asunto y salta la fila."],
    ["bell", "Chat en la app", "Dentro de tu cuenta", "Lunes a domingo, 9:00 a 23:00. Los días de evento grande abrimos 24 horas."],
    ["alert", "Urgencias en puerta", "55 4400 1122", "Si estás afuera del recinto y tu código no abre, marca. Contestamos en menos de 60 segundos."],
  ].map(function (c) {
    return '<article class="card stack stack-3">' +
      '<span style="color:var(--accent)">' + UI.icon(c[0], 22) + "</span>" +
      '<div class="stack stack-1"><strong>' + c[1] + "</strong>" +
      '<span class="mono t-sm">' + c[2] + "</span></div>" +
      '<p class="t-sm txt-2" style="margin:0">' + c[3] + "</p></article>";
  }).join("");

  /* ---------- Formulario ---------- */
  document.getElementById("hp-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("hp-name").value.trim();
    const mail = document.getElementById("hp-mail").value.trim();
    const msg = document.getElementById("hp-msg").value.trim();
    if (name.length < 2) return UI.toast("Escribe tu nombre.", "err");
    if (!/^\S+@\S+\.\S+$/.test(mail)) return UI.toast("Ese correo no es válido.", "err");
    if (msg.length < 15) return UI.toast("Cuéntanos un poco más para poder ayudarte.", "err");
    UI.modal({
      title: "Mensaje recibido",
      body: '<div class="stack stack-3">' +
        '<p class="t-sm txt-2" style="margin:0">Folio <strong class="mono">AY-' +
        Math.floor(3000 + Math.random() * 6000) + "</strong>. Te contestamos a " + UI.esc(mail) +
        " en menos de 6 horas hábiles.</p>" +
        '<div class="note note-ambar"><span></span><div class="t-xs">Este es un prototipo: el mensaje no salió a ningún servidor.</div></div>' +
        "</div>",
      actions: [{ label: "Entendido", variant: "btn-primary" }],
    });
    e.target.reset();
  });

  /* ---------- Sesión ---------- */
  const u = BX.store.session();
  if (u) {
    document.getElementById("hp-name").value = u.name;
    document.getElementById("hp-mail").value = u.email;
  }
})();
