# ADR 0009: busca, glossário, SEO e cabeçalhos

25/11/2026. Context7: `/vercel/next.js` (sitemap, robots, metadados e route handler estático) e `/nextapps-de/flexsearch` (avaliado). Nenhuma biblioteca nova.

## Busca

- **Própria, em vez de FlexSearch ou Pagefind** (desvio do plano). São poucos milhares de linhas curtas; a busca precisa de código exato, prefixo e ordem estável, e cabe em um arquivo testado. Sem WASM, sem worker e sem `eval`, que a CSP não permite.
- Um índice por ano em `/dados/{ano}/busca.json`, buscado só ao abrir. Blocos, páginas, exemplos, termos, registros, novidades e campos.
- Diálogo com padrão combobox: Ctrl+K, setas, Enter e Esc. Vazio restaura a lista de blocos. Sem resultado: "Nenhum resultado para 'xyz'".
- Os campos têm âncora (`#campo-4`) na página do registro.

## Glossário

- 41 termos em `content/glossario.json`, cada um ligado a uma regra já conferida ou a uma frase que o gerador exigiu encontrar nos Manuais dos leiautes 11 e 12. Definições sem apoio nas fontes lidas foram reescritas para dizer menos.
- Dica (tooltip) na primeira vez que o termo aparece em cada nível. Sigla vale só como escrita; palavras comuns, como registro e campo, ficam só no glossário. Atende à WCAG 1.4.13: Esc fecha, o mouse alcança a dica e ela acompanha a rolagem. O leitor de tela lê a descrição ao focar.
- Onde há dica: seções, páginas de bloco, novidades e exemplos. Textos transcritos do Manual ficam como estão.

## SEO

- `SITE_URL` ou o domínio de produção da Vercel definem o endereço. Sem nenhum, o site usa o endereço local e **não se oferece a buscadores**; a prévia da Vercel também não.
- Título, descrição, canônico e Open Graph em toda página; sitemap só com canônicos e com a data da última verificação; imagem em `public/og.png` (`node tools/gerar-og.ts`).
- JSON-LD ficou fora: exigiria injetar HTML sem passar pelo React.

## Cabeçalhos

Somados aos da fase 2: `Cross-Origin-Resource-Policy`, `Origin-Agent-Cluster` e `X-Permitted-Cross-Domain-Policies`.

`security.txt` é gravado no build só se `SECURITY_CONTACT` estiver definido. O contato é de quem publica o site e não foi autorizado ainda.
