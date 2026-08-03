/* Boletix — servidor estático mínimo para desarrollo local.
   Uso:  node tools/server.js  [puerto]                                  */
const http = require("http");
const fs = require("fs");
const path = require("path");

// Este archivo vive en tools/, así que la raíz del sitio es la carpeta de arriba.
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2]) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

http.createServer(function (req, res) {
  let rel = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (rel === "/") rel = "/index.html";

  const file = path.join(ROOT, rel);
  // No servir nada fuera de la carpeta del proyecto.
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("Prohibido");
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const notFound = path.join(ROOT, "404.html");
    if (fs.existsSync(notFound)) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      fs.createReadStream(notFound).pipe(res);
    } else {
      res.writeHead(404).end("No encontrado");
    }
    return;
  }
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, function () {
  console.log("");
  console.log("  BOLETIX corriendo en  http://localhost:" + PORT);
  console.log("");
  console.log("  Cuentas de prueba (contraseña: boletix123)");
  console.log("    fan@boletix.mx        comprador con historial");
  console.log("    nuevo@boletix.mx      comprador sin compras");
  console.log("    promotor@boletix.mx   panel B2B");
  console.log("    admin@boletix.mx      administración del sitio");
  console.log("    staff@boletix.mx      app de puerta");
  console.log("");
  console.log("  Ctrl+C para detener.");
  console.log("");
});
