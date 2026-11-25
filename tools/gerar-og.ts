/** Gera public/og.png (1200×630), a imagem que aparece quando alguém compartilha um link. Uso: node tools/gerar-og.ts */
import { chromium } from "@playwright/test";

const blocos = "0CEJKLMNPQTUVWXY9".split("");
const html = `<!DOCTYPE html><html lang="pt-BR"><style>
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:#000;color:#f3f6ee;font-family:"Segoe UI",system-ui,sans-serif;padding:72px 76px;display:flex;flex-direction:column;justify-content:space-between}
.m{font:600 34px Consolas,monospace}.m b{background:#86bc25;color:#0a0f02;border-radius:10px;padding:4px 16px;margin-right:18px}
h1{font-size:76px;line-height:1.08;letter-spacing:-2px;max-width:980px}p{font-size:32px;color:#a8b39b;margin-top:22px}
.b{display:flex;gap:10px}.b span{font:600 30px Consolas,monospace;width:54px;height:62px;border:2px solid #7d8a6d;border-radius:12px;display:grid;place-items:center}.b .s{background:#86bc25;border-color:#86bc25;color:#0a0f02}
</style><div class="m"><b>ECF e ECD</b>descomplicada</div><div><h1>A ECF explicada bloco a bloco</h1><p>Mapa de fluxo, registros, exemplos e simulador, com a fonte oficial.</p></div>
<div class="b">${blocos.map((b) => `<span class="${b === "M" ? "s" : ""}">${b}</span>`).join("")}</div></html>`;
const navegador = await chromium.launch({ channel: "chrome" });
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html);
await pagina.screenshot({ path: "public/og.png" });
await navegador.close();
