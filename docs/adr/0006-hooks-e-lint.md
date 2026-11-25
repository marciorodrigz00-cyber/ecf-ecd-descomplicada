# ADR 0006: hooks, lint e rastreabilidade obrigatória

25/11/2026. Documentação consultada: https://code.claude.com/docs/en/hooks. Context7: `/websites/oxc_rs_guide_usage` (Oxlint).

## Hooks

- **Forma `args`** (sem shell): funciona igual no Windows e não depende de bash. Exige Claude Code recente (conferido com 2.1.331).
- **Matcher do hook 2 inclui `PowerShell`.** O pedido dizia `Bash|Edit|Write`, mas a ferramenta PowerShell é outra, e é a principal neste computador. Sem ela, `git push` passaria.
- **Avisos "a verificar"** saem em stderr, como pedido, e também em `additionalContext`: com saída 0, o stderr não chega ao agente.
- **Falha interna bloqueia.** Nos hooks 1 e 2, erro inesperado sai com 2. A saída 1 seria ignorada em silêncio. No hook 2, `onFailure: "block"` cobre o caso de o processo nem iniciar.
- `.env.example` também é bloqueado, porque o pedido é `.env*`.
- "A verificar" perdoa falta de rastreabilidade, não conteúdo malformado.

## Lint

**Oxlint**, porque o typescript-eslint não suporta o TypeScript 7 e o `next lint` saiu no Next 16. Regras desligadas, com motivo:

| Regra | Motivo |
|---|---|
| `jsx-a11y/prefer-tag-over-role` | `role` correto com nome acessível; o axe cobre no navegador |
| `jsx-a11y/no-noninteractive-tabindex` em `region` | Área rolável precisa receber foco do teclado |
| `vitest/require-to-throw-message`, `vitest/no-conditional-expect` | Estilo; os testes percorrem listas |
| `vitest/valid-expect` com 2 argumentos | O Vitest aceita a mensagem como segundo argumento |
| `nextjs/no-sync-scripts` só em `layout.tsx` | `prefs.js` roda antes da pintura de propósito |

## Rastreabilidade

- `leiaute` (que podia ser nulo) virou `leiautes`, obrigatório. Só um item "a verificar" pode ficar sem leiaute ou sem ano-calendário.
- `content/leiautes/anos.json` guarda a tabela oficial leiaute × ano do Manual. O build falha se os leiautes de um item não baterem com os anos dele.
- Registros, matriz de regimes, grafo, legendas, textos dos blocos, divergências e tabelas dinâmicas ganharam um bloco `rastreio` que vale para o arquivo.
- Os exemplos fictícios só passam pelo schema: não são regra fiscal.

## Simulador

Os valores iniciais saíram do componente e vêm das empresas fictícias de `content/exemplos`. Percentuais e limites já vinham de `content/regras/tributos.json`.
