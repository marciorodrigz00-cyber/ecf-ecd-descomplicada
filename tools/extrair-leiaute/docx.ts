/** Leitor mínimo de .docx: descompacta word/document.xml e devolve parágrafos e tabelas em ordem. Sem dependências. */
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

export type Par = { tipo: "p"; texto: string; estilo: string };
export type Tab = { tipo: "t"; linhas: string[][] };
export type Item = Par | Tab;

const LIMITE = 64 * 1024 * 1024;

/** Lê uma entrada pelo diretório central do ZIP. */
export function entradaZip(zip: Buffer, nome: string): Buffer {
  const fim = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fim < 0) throw new Error("ZIP inválido");
  const total = zip.readUInt16LE(fim + 10);
  let pos = zip.readUInt32LE(fim + 16);
  for (let i = 0; i < total; i++) {
    if (zip.readUInt32LE(pos) !== 0x02014b50) throw new Error("Diretório central inválido");
    const metodo = zip.readUInt16LE(pos + 10);
    const comprimido = zip.readUInt32LE(pos + 20);
    const tamNome = zip.readUInt16LE(pos + 28);
    const extra = zip.readUInt16LE(pos + 30);
    const comentario = zip.readUInt16LE(pos + 32);
    const local = zip.readUInt32LE(pos + 42);
    if (zip.toString("utf8", pos + 46, pos + 46 + tamNome) === nome) {
      const inicio = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const dados = zip.subarray(inicio, inicio + comprimido);
      return metodo === 0 ? Buffer.from(dados) : inflateRawSync(dados, { maxOutputLength: LIMITE });
    }
    pos += 46 + tamNome + extra + comentario;
  }
  throw new Error(`Entrada ausente: ${nome}`);
}

type No = { nome: string; attrs: string; filhos: No[]; texto: string };

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decodificar = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (tudo, e: string) =>
    e[0] === "#"
      ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
      : (ENTIDADES[e] ?? tudo),
  );

function arvore(xml: string): No {
  const raiz: No = { nome: "#", attrs: "", filhos: [], texto: "" };
  const pilha: No[] = [raiz];
  const re = /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|<[!?][^>]*>|([^<]+)/g;
  for (const m of xml.matchAll(re)) {
    const topo = pilha[pilha.length - 1]!;
    if (m[5] !== undefined) topo.texto += m[5];
    else if (!m[2]) continue;
    else if (m[1]) {
      if (topo.nome !== m[2]) throw new Error(`XML desbalanceado: ${topo.nome} × ${m[2]}`);
      pilha.pop();
    } else {
      const no: No = { nome: m[2], attrs: m[3] ?? "", filhos: [], texto: "" };
      topo.filhos.push(no);
      if (!m[4]) pilha.push(no);
    }
  }
  return raiz;
}

function textoDe(no: No): string {
  if (no.nome === "w:t") return decodificar(no.texto);
  if (no.nome === "w:tab") return " ";
  if (no.nome === "w:br" || no.nome === "w:cr") return "\n";
  if (no.nome === "w:noBreakHyphen") return "-";
  // Texto excluído, campos e alternativas repetidas não são conteúdo.
  if (["w:del", "w:moveFrom", "w:instrText", "mc:Fallback", "w:pPr", "w:rPr"].includes(no.nome)) return "";
  // Texto riscado é texto revogado.
  if (no.nome === "w:r") {
    const rPr = no.filhos.find((f) => f.nome === "w:rPr");
    const risco = rPr?.filhos.find((f) => f.nome === "w:strike" || f.nome === "w:dstrike");
    if (risco && !/w:val="(0|false)"/.test(risco.attrs)) return "";
  }
  return no.filhos.map(textoDe).join("");
}

const limpar = (s: string) =>
  s.replace(/[ \t ]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{2,}/g, "\n").trim();

function celula(tc: No): string {
  const partes: string[] = [];
  const andar = (n: No) => {
    for (const f of n.filhos) {
      if (f.nome === "w:p") partes.push(limpar(textoDe(f)));
      else if (f.nome === "w:tbl") for (const l of linhas(f)) partes.push(l.join(" | "));
      else if (f.nome === "w:sdt" || f.nome === "w:sdtContent") andar(f);
    }
  };
  andar(tc);
  return limpar(partes.filter(Boolean).join("\n"));
}

function linhas(tbl: No): string[][] {
  const saida: string[][] = [];
  const andar = (n: No) => {
    for (const f of n.filhos) {
      if (f.nome === "w:tr") {
        const cels: string[] = [];
        const tcs = (x: No) => {
          for (const c of x.filhos) {
            if (c.nome === "w:tc") cels.push(celula(c));
            else if (c.nome === "w:sdt" || c.nome === "w:sdtContent") tcs(c);
          }
        };
        tcs(f);
        saida.push(cels);
      } else if (f.nome === "w:sdt" || f.nome === "w:sdtContent") andar(f);
    }
  };
  andar(tbl);
  return saida;
}

export function lerDocx(caminho: string): Item[] {
  const xml = entradaZip(readFileSync(caminho), "word/document.xml").toString("utf8");
  const itens: Item[] = [];
  const andar = (n: No) => {
    for (const f of n.filhos) {
      if (f.nome === "w:p") {
        const pPr = f.filhos.find((x) => x.nome === "w:pPr");
        const estilo = pPr?.filhos.find((x) => x.nome === "w:pStyle")?.attrs ?? "";
        itens.push({ tipo: "p", texto: limpar(textoDe(f)), estilo: /w:val="([^"]*)"/.exec(estilo)?.[1] ?? "" });
      } else if (f.nome === "w:tbl") itens.push({ tipo: "t", linhas: linhas(f) });
      else if (["#", "w:document", "w:body", "w:sdt", "w:sdtContent"].includes(f.nome)) andar(f);
    }
  };
  andar(arvore(xml));
  return itens;
}
