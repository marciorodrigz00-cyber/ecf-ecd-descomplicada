# ADR 0007: novidades e monitor de fontes

25/11/2026. Context7: `/websites/github_en_actions`. Versões das ações conferidas nas publicações oficiais em 25/11/2026 e fixadas por commit. Nenhuma biblioteca nova: o monitor usa só o Node.

## O que cada fonte permite

| Fonte | Como é lida | Observação |
|---|---|---|
| gov.br/sped (comunicados, tabelas, manuais, página da ECF) | JSON público do portal (`++api++`), GET | O `robots.txt` pede para não usar `/search`; o monitor não usa busca |
| IN RFB nº 2.004/2021 | JSON público que o próprio portal de normas consome, GET | Dispensa navegador. Sem alteração registrada em 25/11/2026 |
| Download do programa | HTML, GET | Versão e nomes dos instaladores |
| Serviço "Entregar ECF" | HTML, GET | Só a data de modificação; a nota dos usuários muda todo dia. Respondeu 503 algumas vezes |
| Portal antigo do Sped | HTML por HTTP | Secundária, parada em 05/2026 |
| DOU | Manual | 403 para acesso automático, não contornado. INLABS exige cadastro e não foi construído sem conta para testar |
| Busca de normas | Manual | A busca usa POST; o monitor só faz GET |

## Segurança

- **SSRF:** endereços fixos no código, lista exata de hosts, sem porta nem credencial, HTTPS (menos no portal antigo). O DNS é conferido e a conexão usa o mesmo endereço conferido. Cada redirecionamento passa pelas mesmas regras e não pode perder o HTTPS.
- **Limites:** 2 MB, 25 s, 3 redirecionamentos, só HTML, texto ou JSON, sem compressão.
- **Conteúdo externo:** vira texto simples, sem marcação, controles ou invisíveis. No Pull Request, links, imagens, menções e comandos são neutralizados.
- **Escrita:** só em `monitor/`. O site não lê essa pasta.
- **Workflow em dois jobs:** o que lê as fontes não pode escrever no repositório; o que escreve não executa código do projeto. Pull Request em rascunho, sem merge automático.
- **Falha visível:** três tentativas por fonte. Fonte não lida ou estrutura mudada termina o job com erro.

## Dados

- `Novidade` segue a mesma rastreabilidade das regras. Um arquivo por item, com nome `data-slug`.
- Datas do gov.br/sped estão em UTC: 01h30 de 20/10 é 22h30 de 19/10 em Brasília.
- O comunicado da versão 12.2.4 cita a 12.2.3 ao tratar dos leiautes anteriores. O item registra isso e só afirma o leiaute 12.
- A IN RFB nº 2.305/2025 entra no feed, não no simulador, que cobre 2024 e 2025.
- Portarias RFB nº 421 e 426/2024 (prazos no Rio Grande do Sul) ficam fora: tratam do ano-calendário 2023.
- A tabela dinâmica usada nos exemplos já contém a atualização de 24/09/2026.
