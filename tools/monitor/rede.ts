/** Acesso à rede do monitor. Só GET, só hosts da lista, sem endereço privado e com limites. */
import { lookup as resolverDns, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";

/** Host exato → protocolos aceitos. O portal antigo só responde por HTTP. */
export const HOSTS: Readonly<Record<string, readonly string[]>> = {
  "www.gov.br": ["https:"],
  "normasinternet2.receita.fazenda.gov.br": ["https:"],
  "sped.rfb.gov.br": ["http:", "https:"],
};
export const LIMITES = { bytes: 2 * 1024 * 1024, ms: 25_000, redirecionamentos: 3, url: 500 } as const;
const TIPOS = /^(?:text\/html|text\/plain|application\/json)\b/i;

const v4 = new BlockList();
for (const [rede, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) v4.addSubnet(rede, bits, "ipv4");
/** IPv6 público: só 2000::/3, menos as faixas reservadas dentro dela. */
const v6Global = new BlockList();
v6Global.addSubnet("2000::", 3, "ipv6");
const v6 = new BlockList();
for (const [rede, bits] of [["2001::", 32], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) v6.addSubnet(rede, bits, "ipv6");

export function ipPublico(ip: string): boolean {
  const tipo = isIP(ip);
  if (tipo === 4) return !v4.check(ip, "ipv4");
  return tipo === 6 && v6Global.check(ip, "ipv6") && !v6.check(ip, "ipv6");
}

/** Recusa tudo o que não for exatamente um endereço de um host da lista. */
export function validarUrl(bruta: string): URL {
  if (bruta.length > LIMITES.url) throw new Error("URL longa demais");
  // eslint-disable-next-line no-control-regex
  if (/[\u0000- \u007f\\]/.test(bruta)) throw new Error("URL com caractere proibido");
  if (/(?:\.|%2e)(?:\.|%2e)(?:[/?#]|%2f|%5c|$)/i.test(bruta) || /%(?:2f|5c|00|25)/i.test(bruta)) throw new Error("URL com desvio de caminho");
  let u: URL;
  try {
    u = new URL(bruta);
  } catch {
    throw new Error("URL inválida");
  }
  if (u.username || u.password) throw new Error("URL com credencial");
  if (u.port) throw new Error("URL com porta");
  const protocolos = Object.hasOwn(HOSTS, u.hostname) ? HOSTS[u.hostname]! : null;
  if (!protocolos) throw new Error(`Host fora da lista: ${u.hostname}`);
  if (!protocolos.includes(u.protocol)) throw new Error(`Protocolo recusado: ${u.protocol}`);
  return u;
}

type Resolver = (host: string, cb: (e: Error | null, enderecos: LookupAddress[]) => void) => void;
const resolverPadrao: Resolver = (host, cb) => resolverDns(host, { all: true }, (e, a) => cb(e, a ?? []));

/** DNS que falha se qualquer resposta for privada. A conexão usa o mesmo endereço conferido. */
export function lookupSeguro(resolver: Resolver = resolverPadrao): LookupFunction {
  return (host, opcoes, cb) =>
    resolver(host, (e, enderecos) => {
      if (e) return cb(e, "", 0);
      if (enderecos.length === 0) return cb(new Error("DNS sem resposta"), "", 0);
      const privado = enderecos.find((a) => !ipPublico(a.address));
      if (privado) return cb(new Error(`Endereço não público: ${privado.address}`), "", 0);
      if (opcoes.all) return cb(null, enderecos);
      cb(null, enderecos[0]!.address, enderecos[0]!.family);
    });
}

export type Resposta = { status: number; local: string | null; tipo: string; corpo: string };
export type Opcoes = { lookup?: LookupFunction; bytes?: number; ms?: number };

/** Um GET, sem seguir redirecionamento. */
export function pedir(u: URL, { lookup = lookupSeguro(), bytes = LIMITES.bytes, ms = LIMITES.ms }: Opcoes = {}): Promise<Resposta> {
  return new Promise((ok, erro) => {
    const req = (u.protocol === "https:" ? https : http).request(
      u,
      {
        method: "GET",
        agent: false,
        lookup,
        signal: AbortSignal.timeout(ms),
        headers: { accept: u.pathname.includes("++api++") || u.pathname.startsWith("/api/") ? "application/json" : "text/html", "accept-encoding": "identity", "user-agent": "monitor-educacional/1.0" },
      },
      (res) => {
        const falhar = (m: string) => {
          res.destroy();
          erro(new Error(m));
        };
        const tipo = res.headers["content-type"] ?? "";
        const codificacao = res.headers["content-encoding"];
        if (codificacao && codificacao !== "identity") return falhar("Resposta comprimida");
        if (Number(res.headers["content-length"] ?? 0) > bytes) return falhar("Resposta grande demais");
        const partes: Buffer[] = [];
        let total = 0;
        res.on("data", (p: Buffer) => {
          total += p.length;
          if (total > bytes) return falhar("Resposta grande demais");
          partes.push(p);
        });
        res.on("error", erro);
        res.on("end", () => ok({ status: res.statusCode ?? 0, local: res.headers.location ?? null, tipo, corpo: Buffer.concat(partes).toString("utf8") }));
      },
    );
    req.on("error", erro);
    req.end();
  });
}

/** GET com redirecionamento revalidado a cada passo. */
export async function buscar(bruta: string, transporte: (u: URL) => Promise<Resposta> = pedir): Promise<string> {
  let u = validarUrl(bruta);
  for (let i = 0; i <= LIMITES.redirecionamentos; i++) {
    const r = await transporte(u);
    if (r.status >= 300 && r.status < 400) {
      if (!r.local) throw new Error("Redirecionamento sem destino");
      const destino = validarUrl(/^https?:/i.test(r.local) ? r.local : new URL(r.local, u).href);
      if (u.protocol === "https:" && destino.protocol !== "https:") throw new Error("Redirecionamento perde o HTTPS");
      u = destino;
      continue;
    }
    if (r.status !== 200) throw new Error(`Resposta ${r.status}`);
    if (!TIPOS.test(r.tipo)) throw new Error(`Tipo de conteúdo recusado: ${r.tipo.slice(0, 60)}`);
    return r.corpo;
  }
  throw new Error("Redirecionamentos demais");
}
