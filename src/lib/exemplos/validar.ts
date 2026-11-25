import type { Registro } from "@/schemas";
import type { Linha } from "./montar";

const NUMERO = /^-?\d+(,\d{1,4})?$/;

/** Confere cada linha com o leiaute: quantidade de campos, formato, tamanho, valores válidos e obrigatoriedade. */
export function validarArquivo(linhas: readonly Linha[], leiaute: (reg: string) => Registro | undefined): string[] {
  const erros: string[] = [];
  for (const l of linhas) {
    const r = leiaute(l.reg);
    if (!r) {
      erros.push(`${l.reg}: registro não existe`);
      continue;
    }
    const campos = r.campos.slice(1);
    if (campos.length !== l.campos.length) {
      erros.push(`${l.reg}: ${l.campos.length} campos, o leiaute tem ${campos.length}`);
      continue;
    }
    campos.forEach((c, i) => {
      const v = l.campos[i]!;
      const onde = `${l.reg}.${c.nome}="${v}"`;
      if (v === "") {
        if (c.obrigatorio === "Sim") erros.push(`${onde}: obrigatório vazio`);
        return;
      }
      if (/[|\r\n]/.test(v)) erros.push(`${onde}: caractere proibido`);
      if ((c.tipo === "N" || c.tipo === "NS") && !NUMERO.test(v)) erros.push(`${onde}: não é número`);
      if (c.tipo === "N" && v.startsWith("-")) erros.push(`${onde}: numérico sem sinal não aceita negativo`);
      const max = /^\d+$/.test(c.tamanho) ? Number(c.tamanho) : null;
      if (max && v.replace(/[-,]/g, "").length > max) erros.push(`${onde}: maior que ${max}`);
      const lista = /^\[([^\]]+)\]$/.exec(c.valores.replace(/\s/g, ""))?.[1];
      // Só listas simples e de um código por campo; formatos compostos (ex.: FORMA_TRIB_PER) não entram.
      if (lista && /^[\w]+(;[\w]+)+$/.test(lista) && v.length <= Math.max(...lista.split(";").map((x) => x.length))) {
        if (!lista.split(";").includes(v)) erros.push(`${onde}: fora de [${lista}]`);
      }
    });
  }
  return erros;
}