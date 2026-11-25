/**
 * Hook 1 (PostToolUse, Edit|Write): valida o conteúdo fiscal logo depois da edição.
 * Uso manual: node .claude/hooks/validar-conteudo.mjs --todos
 */
import { avisar, bloquear, lerEntrada, relativo } from "./lib/entrada.mjs";
import { eConteudo, formatar, todosOsArquivos, validarArquivo } from "./lib/conteudo.mjs";

if (process.argv.includes("--todos")) {
  let itens = 0;
  let avisos = 0;
  const arquivos = todosOsArquivos();
  for (const a of arquivos) {
    const r = await validarArquivo(a);
    itens += r.erros.length;
    avisos += r.avisos.length;
    if (r.erros.length) console.log(formatar(relativo(a), r.erros));
    for (const t of r.avisos) console.log(`~ ${t}`);
  }
  console.log(`\n${arquivos.length} arquivos; ${itens} itens reprovados; ${avisos} "a verificar"`);
  process.exitCode = itens ? 2 : 0;
} else {
  try {
    const entrada = await lerEntrada();
    const arquivo = entrada.tool_input?.file_path ?? entrada.tool_response?.filePath;
    const rel = arquivo ? relativo(arquivo) : null;
    if (eConteudo(rel)) {
      const { erros, avisos } = await validarArquivo(arquivo);
      if (erros.length) {
        bloquear(
          [
            `Conteúdo fiscal reprovado em ${rel}. Corrija com fonte oficial ou marque o item com "status": "a-verificar".`,
            formatar(rel, erros),
            ...avisos.map((a) => `Aviso: ${a}`),
          ].join("\n"),
        );
      } else if (avisos.length) avisar("PostToolUse", avisos.map((a) => `Aviso: ${a}`).join("\n"));
    }
  } catch (e) {
    // Saída 1 seria ignorada em silêncio; uma validação que não rodou precisa aparecer.
    bloquear(`A validação do conteúdo não rodou: ${e.message}`);
  }
}
