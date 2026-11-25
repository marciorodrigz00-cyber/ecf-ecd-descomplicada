/**
 * Serve out/ com os cabeçalhos do vercel.json, para testar perto da produção.
 * Escuta só em 127.0.0.1. CSP_REPORT_ONLY=1 troca a CSP por Report-Only e retira a <meta>.
 */
import { createReadStream, readFileSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { gzipSync } from "node:zlib";

const RAIZ = realpathSync(path.resolve("out"));
const PORTA = Number(process.env.PORTA ?? 4173);
const RELATAR = process.env.CSP_REPORT_ONLY === "1";
const { headers, redirects } = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  redirects: { source: string; destination: string }[];
  headers: { headers: { key: string; value: string }[] }[];
};
const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

function arquivo(p: string): string | null {
  for (const c of [p, `${p}.html`, path.join(p, "index.html")]) {
    const cheio = path.join(RAIZ, c);
    if (cheio !== RAIZ && !cheio.startsWith(RAIZ + path.sep)) return null;
    try {
      if (statSync(cheio).isFile()) return cheio;
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let caminho: string;
  try {
    caminho = decodeURIComponent((req.url ?? "/").split("?")[0]!);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (/[\0\r\n\\]/.test(caminho) || caminho.split("/").includes("..")) {
    res.writeHead(400).end();
    return;
  }
  for (const r of redirects) {
    // Mesma forma do vercel.json: caminho fixo, ou um único parâmetro com expressão restrita.
    const m = /^(.*)\/:path\((.+)\)$/.exec(r.source);
    const achou = m ? new RegExp(`^${m[1]}/(${m[2]})$`).exec(caminho) : null;
    if (achou || caminho === r.source) {
      res.writeHead(307, { Location: achou ? r.destination.replace(":path", achou[1]!) : r.destination }).end();
      return;
    }
  }  const achado = arquivo(caminho) ?? path.join(RAIZ, "404.html");
  const existe = arquivo(caminho) !== null;
  const tipo = TIPOS[path.extname(achado)] ?? "application/octet-stream";
  let html = tipo.startsWith("text/html") ? readFileSync(achado, "utf8") : null;
  let meta = "";
  if (html && RELATAR) {
    html = html.replace(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/, (_, c: string) => {
      meta = c;
      return "";
    });
  }
  for (const { key, value } of headers.flatMap((h) => h.headers)) {
    // Em http local, estes dois forçariam HTTPS; são conferidos no vercel.json e no preview.
    if (key === "Strict-Transport-Security") continue;
    if (key !== "Content-Security-Policy") res.setHeader(key, value);
    else if (!RELATAR) res.setHeader(key, value.replace("; upgrade-insecure-requests", ""));
    else res.setHeader("Content-Security-Policy-Report-Only", [value.replace("; upgrade-insecure-requests", ""), meta].filter(Boolean));
  }
  // A Vercel comprime texto e guarda os arquivos com hash no nome; sem isso, medir desempenho aqui não diria nada.
  if (caminho.startsWith("/_next/static/")) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  const texto = /^(?:text|application\/(?:json|xml))|svg/.test(tipo) ? Buffer.from(html ?? readFileSync(achado, "utf8")) : null;
  const gzip = texto !== null && /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""));
  if (gzip) res.setHeader("Content-Encoding", "gzip");
  if (texto) res.setHeader("Vary", "Accept-Encoding");
  res.writeHead(existe ? 200 : 404, { "Content-Type": tipo });
  if (req.method === "HEAD") res.end();
  else if (texto) res.end(gzip ? gzipSync(texto) : texto);
  else createReadStream(achado).pipe(res);
}).listen(PORTA, "127.0.0.1", () => console.log(`http://127.0.0.1:${PORTA}`));
