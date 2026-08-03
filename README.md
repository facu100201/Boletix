# Boletix — prototipo funcional

Boletera para espectáculos de mediana escala en la Ciudad de México. Prototipo navegable
construido con HTML, CSS y JavaScript sin dependencias, sin build y sin base de datos: todo el
estado vive en `localStorage` del navegador.

Acompaña al documento de valuación en [`docs/`](docs/) y traduce su propuesta de valor —
boletaje justo, sin cargos ocultos, con QR dinámico y reventa topada— en un producto que se puede
recorrer de principio a fin.

---

## Cómo abrirlo

**Opción recomendada (servidor local):**

```powershell
.\start.ps1
```

Levanta `http://localhost:8080` y abre el navegador. Usa Node si está instalado —con el
`server.js` incluido, sin descargar nada— y cae a Python si no. Para otro puerto:
`.\start.ps1 -Puerto 3000`, o directamente `node tools/server.js 3000`.

**Opción rápida:** abre `index.html` directamente con doble clic. Funciona, pero algunos
navegadores bloquean `localStorage` bajo el protocolo `file://`. Si eso pasa, el sitio sigue
operando en memoria y sólo se pierde el estado al recargar.

---

## Cuentas precargadas

La contraseña de todas es **`boletix123`**. Desde la portada o la pantalla de entrar puedes
tocar cualquiera para acceder directo.

| Correo | Rol | Qué puedes hacer |
|---|---|---|
| `fan@boletix.mx` | Comprador | María Fernanda, con 5 compras precargadas, boletos vigentes, un reembolso histórico y tarjeta guardada. |
| `nuevo@boletix.mx` | Comprador | Diego, cuenta limpia para probar el flujo de compra desde cero. |
| `promotor@boletix.mx` | Promotor B2B | Renata, de Indie Live MX. Panel de ventas, creación de eventos y liquidación. |
| `admin@boletix.mx` | Administrador | Aprobaciones, incidencias de seguridad, usuarios, finanzas y reglas de la plataforma. |
| `staff@boletix.mx` | Personal de puerta | App de validación de accesos. |

Para volver al estado inicial: botón **Reiniciar datos de la demostración** en la portada, o
`BX.app.resetDemo()` desde la consola.

---

## Recorridos que vale la pena probar

**Compra completa.** Entra como `fan@boletix.mx` → un evento de la cartelera → elige zona →
verificación anti-bot → fila virtual con precio congelado → si la zona es numerada, plano de
asientos → checkout con 3-D Secure simulado → confirmación con descarga de comprobante y `.ics`.

**El QR que cambia.** En *Mis boletos* abre cualquier boleto y quédate mirando: el código se
regenera cada 15 segundos con una barra de progreso. Copia el código de respaldo alfanumérico.

**Ciclo completo del boleto.** Con ese código, entra como `staff@boletix.mx` a la app de puerta y
valídalo. Vuelve a escanearlo: lo detecta como duplicado. Prueba también un código inventado.

**Reembolso y reventa.** Desde *Mis boletos*, reembolsa una compra y observa el reloj de 72 horas
en la sección Reembolsos. O publícala en Reventa Justa: el precio queda fijado al original y no
hay forma de subirlo.

**Transferencia.** Transfiere un boleto a otro correo. El código anterior muere en el acto —
compruébalo intentando validarlo en la app de puerta.

**Panel del promotor.** Como `promotor@boletix.mx`, crea un evento y mira cómo la vista previa te
muestra en tiempo real el Precio Total Real que verá el público. El evento entra *en revisión*.

**Aprobación.** Como `admin@boletix.mx`, ve a Aprobaciones y publica uno de los eventos en cola.
Aparece de inmediato en la cartelera pública.

---

## Qué problema resuelve cada función

La investigación de quejas de usuarios y reportes del sector está condensada en
[`paginas/transparencia.html`](paginas/transparencia.html) y en la portada, con sus fuentes
citadas. En resumen:

| Queja documentada | Función de Boletix |
|---|---|
| Cargos ocultos revelados en el último paso (*drip pricing*) | **Precio Total Real**: cada cifra del sitio ya incluye comisión e IVA |
| El precio sube mientras esperas en la fila virtual | **Fila con precio congelado** y posición real, no animada |
| Boletos clonados: llegas y alguien ya entró con tu código | **QR dinámico** que rota cada 15 s y no se puede capturar |
| Reventa con sobreprecios de hasta 400% | **Reventa Justa** con tope duro al precio original |
| Reembolsos negados o eternos | **Reembolso a un toque** hasta 48 h antes, devuelto en 72 h con la comisión incluida |
| El sitio se cae justo cuando salen los boletos | **Carrito blindado**: 10 min de apartado aunque falle el pago |
| Precios dinámicos que cambian sin avisar | **Precio fijo garantizado**, prohibido por contrato al promotor |
| Bots que acaparan el inventario | **Tope de 6 boletos por cuenta** y verificación antes de la fila |
| Eventos falsos y páginas clonadas | **Sello de Promotor Verificado** con RFC y permiso de recinto |
| Sin señal en el recinto, el boleto no abre | **Boleto offline**, y app de puerta que valida sin conexión |

---

## Estructura

La raíz sólo contiene lo que tiene que estar ahí: la portada, la página de error que los
servidores buscan por convención, el README y el lanzador. Todo lo demás vive en su carpeta.

```
Boletix/
├── index.html                     Portada: hero, cartelera, comparador de precios, dolores del mercado
├── 404.html                       Página de error
├── README.md
├── start.ps1                      Lanzador para Windows
│
├── paginas/                       Las 18 páginas restantes del sistema
│   ├── eventos.html               Cartelera con búsqueda, filtros y orden
│   ├── evento.html?id=            Ficha del evento: zonas, precios desglosados, recinto, promotor
│   ├── fila.html                  Fila virtual con verificación anti-bot y precio congelado
│   ├── asientos.html              Plano de asientos interactivo, navegable con teclado
│   ├── checkout.html              Pasarela: tarjeta, SPEI, PayPal, Mercado Pago, efectivo, 3-D Secure
│   ├── confirmacion.html          Confirmación, comprobante descargable, .ics y factura
│   ├── login.html                 Entrar, con acceso directo a las cuentas de prueba
│   ├── registro.html              Alta de cuenta con medidor de contraseña
│   ├── cuenta.html                Hub del comprador: boletos, compras, reventa, reembolsos, perfil
│   ├── boleto.html?t=             Boleto individual con QR dinámico y modo puerta
│   ├── reventa.html               Mercado secundario con tope al precio original
│   ├── promotor.html              Panel B2B: ventas, alta de eventos, público, liquidación
│   ├── admin.html                 Panel de sitio: aprobaciones, seguridad, usuarios, reglas
│   ├── escaner.html               App de validación en puerta
│   ├── transparencia.html         Cómo cobramos y por qué, con las fuentes de la investigación
│   ├── ayuda.html                 Centro de ayuda con buscador y contacto
│   ├── publica-tu-evento.html     Landing B2B para promotores y recintos
│   └── legal.html                 Términos, privacidad, reembolsos y accesibilidad
│
├── assets/
│   ├── css/
│   │   └── boletix.css            Sistema de diseño completo, mobile first, tema claro y oscuro
│   └── js/
│       ├── core/                  Lo que cargan todas las páginas
│       │   ├── data.js            Semilla: 22 eventos, 12 recintos, 5 promotores, 5 usuarios
│       │   ├── store.js           Estado y persistencia con respaldo en memoria
│       │   ├── ui.js              Rutas, formato, iconos, pósters generativos, QR, diálogos
│       │   └── app.js             Shell: cabecera, navegación inferior, pie, tema, sesión
│       └── pages/                 Un script por página, con el nombre de su vista
│
├── docs/                          Documentación del proyecto
│   └── Valuación de Proyectos - Boletix.md
│
└── tools/
    └── server.js                  Servidor estático sin dependencias
```

### Cómo se resuelven las rutas

Como las páginas viven un nivel por debajo de `index.html`, el shell compartido no puede escribir
ligas relativas fijas: la misma cabecera se dibuja en la portada y en `paginas/`. La solución está
en [`assets/js/core/ui.js`](assets/js/core/ui.js): `UI.ROOT` deduce la raíz del sitio a partir de
la ruta del propio script, y `UI.url("paginas/eventos.html")` devuelve una liga absoluta que
funciona igual bajo `http://` que bajo `file://`, sin importar en qué carpeta esté la página.

Los scripts de página no necesitan nada de esto: como todas las vistas son hermanas dentro de
`paginas/`, se enlazan entre sí con el nombre del archivo a secas.

---

## Notas de diseño

**Dirección visual: "Marquesina".** Cartelería de concierto independiente mexicana cruzada con la
taquilla de un teatro. Tinta casi negra con sesgo rojo, **rosa mexicano** como acento, **ámbar de
foco de marquesina** como secundario y jade para estados verificados. Tipografía *Bricolage
Grotesque* para títulos, *Instrument Sans* para interfaz y *DM Mono* para códigos y cifras. El
motivo del talón perforado se usa sólo donde el objeto realmente es un boleto.

**Mobile first de verdad.** Todo el CSS parte de una columna y crece hacia arriba con
`min-width`. En móvil hay barra de navegación inferior tipo aplicación y barras de acción fijas
para comprar. Las tablas hacen scroll en su propio contenedor: el cuerpo de la página nunca se
desplaza en horizontal.

**Sin imágenes externas.** Los carteles de los eventos se generan en `canvas` a partir del id del
evento, así que son reproducibles y no hay ni una petición de red. El sitio funciona sin conexión
salvo por las tipografías de Google Fonts, que degradan a la pila del sistema.

**Tema claro y oscuro.** Se respeta `prefers-color-scheme` y el botón de la cabecera lo sobrescribe
en ambas direcciones. También se respeta `prefers-reduced-motion`.

---

## Limitaciones conocidas

Es un prototipo académico, y conviene tener claro dónde termina la simulación:

- **El QR es una representación gráfica, no un código escaneable.** Se dibuja una matriz
  determinista a partir del token rotativo, con sus patrones de posición, para ilustrar el
  comportamiento. La validación en la app de puerta se hace con el código alfanumérico de
  respaldo, que sí es real y sí recorre todo el ciclo del sistema.
- **No hay pagos.** El checkout valida el número de tarjeta con el algoritmo de Luhn y simula
  3-D Secure, pero no existe pasarela ni cargo alguno.
- **No hay servidor.** No se envía nada a ningún lado. Los formularios de contacto y alta de
  promotor confirman en pantalla y ahí termina.
- **No hay correo.** Los comprobantes se descargan como archivo desde el navegador.
- **La fila virtual está acelerada** para que se pueda ver en segundos lo que en producción
  tomaría minutos.
