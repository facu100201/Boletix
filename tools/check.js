/* Boletix — verificación del sitio antes de publicar.
   Uso:  node tools/check.js

   Tres revisiones, ninguna dependencia externa:
     1. Sintaxis de todos los .js (los del navegador se revisan como script clásico).
     2. Ligas internas: cada href/src local debe apuntar a un archivo que existe,
        con las mayúsculas exactas (GitHub Pages corre en Linux y sí distingue).
     3. Cabecera mínima de cada .html: doctype, lang, charset, viewport y título.

   Sale con código 1 si algo falla, para que Actions detenga la publicación.      */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([".git", ".github", "node_modules", "docs"]);

const errors = [];
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");
const fail = (file, msg) => errors.push(rel(file) + ": " + msg);

/* ---------- Inventario de archivos ---------- */
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}
const files = walk(ROOT, []);
const htmls = files.filter((f) => f.endsWith(".html"));
const jss = files.filter((f) => f.endsWith(".js"));

/* ---------- 1. Sintaxis de JavaScript ---------- */
for (const f of jss) {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
  } catch (e) {
    fail(f, "error de sintaxis\n    " + String(e.stderr || e.message).trim().split("\n").slice(0, 4).join("\n    "));
  }
}

/* ---------- 2. Ligas internas ---------- */
// Comprueba que la ruta exista con exactamente las mismas mayúsculas.
const dirCache = new Map();
function existsExact(target) {
  const parts = path.relative(ROOT, target).split(path.sep);
  let cur = ROOT;
  for (const part of parts) {
    if (!dirCache.has(cur)) {
      let names = [];
      try { names = fs.readdirSync(cur); } catch (e) { /* no es carpeta */ }
      dirCache.set(cur, new Set(names));
    }
    if (!dirCache.get(cur).has(part)) return false;
    cur = path.join(cur, part);
  }
  return true;
}

const ATTR = /(?:href|src)\s*=\s*"([^"]*)"/gi;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

for (const f of htmls) {
  const html = fs.readFileSync(f, "utf8");
  for (const m of html.matchAll(ATTR)) {
    const raw = m[1].trim();
    if (!raw || EXTERNAL.test(raw)) continue; // http:, data:, mailto:, //cdn, #ancla

    const clean = raw.split("#")[0].split("?")[0];
    if (!clean) continue;

    // Las rutas absolutas rompen el sitio bajo /Boletix/ en GitHub Pages.
    if (clean.startsWith("/")) {
      fail(f, 'ruta absoluta "' + raw + '" — usa una ruta relativa');
      continue;
    }

    const target = path.resolve(path.dirname(f), decodeURIComponent(clean));
    if (!target.startsWith(ROOT)) {
      fail(f, '"' + raw + '" apunta fuera del proyecto');
    } else if (!existsExact(target)) {
      fail(f, '"' + raw + '" no existe (' + rel(target) + ")");
    }
  }
}

/* ---------- 3. Cabecera de cada página ---------- */
const HEAD_RULES = [
  [/<!DOCTYPE html>/i, "falta <!DOCTYPE html>"],
  [/<html[^>]+lang\s*=/i, "falta el atributo lang en <html>"],
  [/<meta[^>]+charset\s*=/i, "falta <meta charset>"],
  [/<meta[^>]+name\s*=\s*"viewport"/i, "falta <meta name=viewport>"],
  [/<title>\s*\S[^<]*<\/title>/i, "falta un <title> con contenido"],
];
for (const f of htmls) {
  const html = fs.readFileSync(f, "utf8");
  for (const [re, msg] of HEAD_RULES) if (!re.test(html)) fail(f, msg);
}

/* ---------- Resultado ---------- */
console.log(
  "Boletix — revisadas " + htmls.length + " páginas y " + jss.length + " archivos JS."
);
if (errors.length) {
  console.error("\n" + errors.length + " problema(s):\n");
  for (const e of errors) console.error("  - " + e);
  console.error("");
  process.exit(1);
}
console.log("Todo en orden.");
