/**
 * Depois do build: grava out/.well-known/security.txt se SECURITY_CONTACT estiver definido.
 * O contato é de quem publica o site: sem autorização, o arquivo não existe.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function securityTxt(contato: string, site: string | undefined, agora: Date): string {
  if (!/^(?:mailto:[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+|https:\/\/[^\s<>"]+)$/.test(contato)) throw new Error("SECURITY_CONTACT precisa ser mailto: ou https:");
  const expira = new Date(agora);
  // A RFC 9116 recomenda menos de um ano.
  expira.setUTCDate(expira.getUTCDate() + 330);
  return [
    `Contact: ${contato}`,
    `Expires: ${expira.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "Preferred-Languages: pt, en",
    ...(site?.startsWith("https://") ? [`Canonical: ${site.replace(/\/$/, "")}/.well-known/security.txt`] : []),
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pasta = path.resolve("out/.well-known");
  const contato = process.env.SECURITY_CONTACT;
  if (contato) {
    const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
    mkdirSync(pasta, { recursive: true });
    writeFileSync(path.join(pasta, "security.txt"), securityTxt(contato, site, new Date()));
    console.log("security.txt gravado");
  } else {
    rmSync(path.join(pasta, "security.txt"), { force: true });
    console.log("security.txt não gravado: defina SECURITY_CONTACT");
  }
}
