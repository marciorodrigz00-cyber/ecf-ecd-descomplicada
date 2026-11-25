/** Hook 2 (PreToolUse, Bash|PowerShell|Edit|Write): ações sensíveis precisam de aprovação manual. */
import { bloquear, lerEntrada } from "./lib/entrada.mjs";
import { arquivoSensivel, conteudoSecreto, motivoComando } from "./lib/comandos.mjs";

const instrucao =
  "Essa ação precisa da aprovação manual do usuário. Não tente outro caminho: explique o que pretende e peça que o usuário a execute ou autorize.";

try {
  const { tool_name: ferramenta = "", tool_input: dados = {} } = await lerEntrada();
  if (ferramenta === "Edit" || ferramenta === "Write") {
    const arquivo = String(dados.file_path ?? "");
    const novo = String(dados.content ?? dados.new_string ?? "");
    if (arquivoSensivel(arquivo)) bloquear(`Bloqueado: edição de arquivo com segredos (${arquivo}). ${instrucao}`);
    else if (conteudoSecreto(novo)) bloquear(`Bloqueado: o texto parece conter um segredo (chave ou token). ${instrucao}`);
  } else if (ferramenta === "Bash" || ferramenta === "PowerShell") {
    const motivo = motivoComando(String(dados.command ?? ""));
    if (motivo) bloquear(`Bloqueado: ${motivo}. ${instrucao}`);
  }
} catch (e) {
  // Barreira de segurança: se não deu para analisar, não libera.
  bloquear(`Bloqueado: o hook não conseguiu analisar a ação (${e.message}). ${instrucao}`);
}
