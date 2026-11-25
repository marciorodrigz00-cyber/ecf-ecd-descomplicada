# Plataforma ECF: Fase 1 (arquitetura) e roteiro

> **Alteração posterior (24/11/2026):** o usuário decidiu deixar o Bloco S fora do escopo. Onde se lê "18 blocos", leia "17 blocos cobertos".

## Contexto

Plataforma web em pt-BR para entender e preparar a ECF, para iniciantes e profissionais, com regras fiscais versionadas e rastreáveis à fonte oficial. O projeto começa do zero: a pasta não tem código.
Este documento é a entrega da **fase 1**. **Aprová-lo libera só a preparação do ambiente e a fase 2.** Depois disso, paro e peço nova aprovação.

Decisões já tomadas por você: instalo Node e Git via winget; projeto em `C:\dev\ecf-descomplicada` (nome provisório); conteúdo completo para AC 2025 (leiaute 12) e AC 2024 (leiaute 11); DOU via INLABS opcional.

## O que a verificação de 24/11/2026 mudou no pedido

| Achado | Consequência |
|---|---|
| O Manual do leiaute 12 (Word, 20/05/2026) tem o **Bloco S** (TEF/SAF, futebol), ausente da sua lista | São **18 blocos** no leiaute 12. A lista vem do dado de cada leiaute, não do código. Se o S existe no leiaute 11, a extração dirá |
| `sped.rfb.gov.br` só responde por **HTTP**, e o último destaque de ECF é a v12.1.6 (25/05/2026). A página de download da RFB já traz a **v12.2.8** (atualizada em 19/10/2026), e existe o portal novo `gov.br/sped` | `gov.br` vira fonte primária. O portal antigo vira sinal secundário: sem TLS, seu conteúdo nunca é aceito sem conferência |
| O leiaute 12 vale para AC 2025 **e** situações especiais de 2026, e a LC 224/2025 + IN RFB 2.305/2025 afetam estas últimas | A vigência tem dois eixos (AC normal × situação especial), não só um ano |
| O leiaute 13 não apareceu nas buscas | Fica "a verificar"; o AC 2026 não é oferecido no seletor |
| O portal Normas (IN 2.004, `consulta/externa/114966`) é SPA: GET simples não traz o texto | Conferir no navegador na fase 3. No monitor, spike na fase 6; se falhar, verificação manual |
| `in.gov.br` respondeu 403 | Não contornar. INLABS opcional (estava em manutenção hoje) |
| Uma busca associou a IN RFB 2.274/2025 à ECF; o LegisWeb diz que ela trata do Repetro-Sped | "A verificar" no texto oficial na fase 3. O gov.br/sped segue citando a IN 2.004 como a norma da ECF |
| O Manual Word é parseável: 514 tabelas e 188 códigos de registro localizados por regex (contagem preliminar) | Extração semiautomática do leiaute, com revisão |
| O Manual diz que "só" inativas são dispensadas, mas a mesma norma lista outros casos (§ 1º) | O quiz segue o texto da IN, não o resumo do Manual |

## Arquitetura

**Site 100% estático, sem servidor.** Next.js 16 (App Router, `output: 'export'`) na Vercel. Motivos: conteúdo gerado em build (RD), sem rotas de API para atacar (SG), sem custo por acesso. Os itens SG de API são cobertos por testes de que a superfície não existe (POST → 405, nada de código de servidor exposto).

| Tema | Escolha | Por quê |
|---|---|---|
| Base | Next 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Motion (sucessor do pacote framer-motion) | Sua stack. TypeScript 7 só se Next/ESLint suportarem; senão, a versão anterior suportada |
| Conteúdo | JSON + Zod para regras; `@next/mdx` para prosa | MDX nunca contém número fiscal: usa `<Regra id="…"/>` |
| Busca | FlexSearch, índice por AC gerado em build e carregado no 1º Ctrl+K | Busca por código/campo; Pagefind indexa páginas e exige WASM na CSP |
| Diagramas | SVG/HTML próprios a partir de `grafo.json`, com lista textual equivalente | **Desvio proposto:** React Flow e Mermaid pesam e dificultam AC/RS/CSP |
| Dinheiro | Centavos em `bigint`, alíquotas em inteiros, arredondamento declarado na regra | Sem erro de ponto flutuante |
| Preferências | localStorage com schema e try/catch; IndexedDB só se algo crescer | Evita QuotaExceededError |
| Revisão de rascunhos | **Pull Request no GitHub**, com branch protegida | Autenticação e aprovação humana prontas; sem painel para proteger |
| Node | 24 LTS | Atende Vitest 5, Lighthouse 13 e Playwright |

**Nível**: os dois textos vão no HTML; `data-nivel` em `<html>` (definido antes da pintura) mostra um deles. Sem piscar e sem requisição extra.
**Ano**: fica na URL. `/blocos/m` é o AC padrão e `/ac/2024/blocos/m` é explícito. A URL vence; a preferência salva só atua ao entrar em `/`.
**CSP**: nonce exige renderização dinâmica, então um passo pós-build calcula os hashes dos scripts inline por página (meta CSP) e o `vercel.json` traz os demais cabeçalhos. Exceção prevista: `style-src-attr 'unsafe-inline'` (estilos de animação). **Spike na fase 2** (Report-Only), para não descobrir isso na fase 7.

### Estrutura de pastas
```
content/
  fontes.json                 catálogo de fontes oficiais
  leiautes/{11,12}/           leiaute.json, blocos/*.json, registros/*.json, grafo.json, tabelas/
  regras/                     prazos, multas, aliquotas, presuncao, obrigatoriedade (JSON)
  quiz/  exemplos/{real,presumido,imune}/  novidades/  glossario/  linha-do-tempo.json
  paginas/*.mdx               prosa com <Nivel> e <Regra>
src/app/                      rotas (+ espelho ac/[ano]/)
src/components/{ui,layout,ecf,quiz,simulador,busca}/
src/lib/{conteudo,formatos,calculo,quiz,busca,preferencias,seguranca}/
src/schemas/                  Zod (tipos derivados daqui)
tools/{extrair-leiaute,monitor,csp-hashes,gerar-relatorio}/
tests/{unit,e2e,a11y,seguranca,perf}/  casos.json
.github/workflows/{ci,monitor}.yml   vercel.json   public/.well-known/security.txt
docs/adr/                     decisões de arquitetura
```

## Modelo de dados

Todo item fiscal estende `Rastreavel`; o build **falha** se faltar campo:
```ts
Rastreavel = {
  id, fonte: { id /* de fontes.json */, url, trecho /* art., §, página */ },
  norma, leiaute,                       // leiaute: "12" | null → "não se aplica"
  vigencia: { acNormal: number[], situacaoEspecial: number[], inicio?, fim? },
  verificadoEm: "AAAA-MM-DD",
  status: "extraido" | "conferido" | "revisado" | "a-verificar",
  revisor?                              // obrigatório em "revisado" (pessoa)
}
```
- `Regra`: valor tipado (dinheiro, percentual, prazo, texto) + `Rastreavel`.
- `Bloco`: letra, nome, cor, ícone, objetivo (iniciante), errosComuns, obrigatoriedade por regime.
- `Registro`: código, nível, ocorrência, chave, regrasValidacao[], campos[] (nº, nome, descrição, tipo, tamanho, decimal, valoresValidos, obrigatório), `ordemOriginal`.
- `NoQuiz` / `ResultadoQuiz`: árvore de decisão; cada resultado aponta regras. `Aresta`: origem → destino (ECD → ECF).
- `EmpresaFicticia`: dados + `registros` + `invariantes` (balanço fecha, e-Lalur soma, totais batem), testadas.
- `Novidade`: data, resumo, link, tipo. `Termo`: definição por nível, sinônimos.

`extraido` e `a-verificar` aparecem com selo próprio na interface; "Atualizado conforme leiaute X, verificado em…" usa a data **mais antiga** da página.
Trechos do Manual são anexo de ato oficial (ADE Cofis); textos editoriais do gov.br (CC BY-ND) são resumidos com link, não copiados.

## Mapa do site
```
/                         home (progresso, atalhos por nível)
/o-que-e   /importancia   /quem-deve-entregar (quiz)
/blocos  →  /blocos/m  →  /blocos/m/m300      (18 blocos no leiaute 12)
/preencher                stepper guiado por regime
/exemplos → /exemplos/{lucro-real,lucro-presumido,imune-isenta}
/simulador   /novidades → /novidades/[slug]   /glossario
/fontes                   fontes, verificações e itens "a verificar"
/sobre  /acessibilidade   404
```
Tudo também em `/ac/2024/…`, com canonical correto e aviso se o item não existir naquele leiaute.

## Monitoramento (fase 6)

Job diário no GitHub Actions: buscar → normalizar → comparar hash/versão → sanitizar → abrir **PR de rascunho** com diff e link. Nunca faz merge; a CI bloqueia o PR sem revisor humano.

| Fonte | Método |
|---|---|
| RFB, download da ECF (versão do programa) | GET, sinal principal de versão |
| `gov.br/sped`, ECF e manuais | GET da data de modificação; lista dinâmica via navegador sem interface |
| `gov.br`, serviço "Entregar ECF" | GET |
| `sped.rfb.gov.br` (manuais, destaques) | HTTP, secundário |
| Normas RFB (IN 2.004 e alterações) | Navegador sem interface; alternativa: lembrete manual |
| DOU | INLABS se houver secrets; senão, lembrete com link |

Anti-SSRF: allowlist exata de hosts, HTTP só para o portal antigo, redirecionamento revalidado, IP privado recusado, limite de tamanho e tempo. Risco: fontes podem recusar IPs estrangeiros dos runners; alternativa é o agendador local ou runner próprio. Nada de burlar bloqueio.

## Design (detalhado na fase 2)

Estilo fintech, claro/escuro. 18 cores distintas e acessíveis não são viáveis: 6 **famílias** de matiz (identificação, recuperação ECD/ECF, contábil, apuração, internacional, informações), cada bloco com tom + **ícone + letra**, para nunca depender só de cor. Contraste testado por token. Fontes servidas do próprio domínio.

## Testes

- `tests/casos.json`: catálogo único (SM-001, CT-001…, CN, RS, AC, RD, SG), cada caso com fase, automação e severidade. O título do teste leva o ID.
- **Vitest**: cálculo (casos à mão, zero, negativo, prejuízo, limites), schemas, quiz (1 por regime), formatos, busca, anti-SSRF, invariantes dos exemplos.
- **Guarda de conteúdo**: falha se houver `%`, `R$`, data ou "IN/Lei/ADE nº" escrito em componente ou MDX.
- **Playwright**: URL/F5/Voltar, persistência, cliques duplos, 375/768/1050/1440 px, pageerror/console, XSS inofensivo, cabeçalhos e 404 de arquivos sensíveis. Usa o Chrome já instalado, 1–2 workers (máquina de 5,7 GB).
- **axe-core** em cada rota × tema × nível; **Lighthouse** em separado.
- `gerar-relatorio` junta os resultados em `relatorio-testes-ecf.html` autocontido, marcando revalidado × reaproveitado; veredicto calculado pelos seus critérios e deploy bloqueado se "Reprovado".
- Cabeçalhos: local num servidor que lê o `vercel.json`; HSTS e bordas só no preview da Vercel, senão "Bloqueado".

## Fases e portões

| Fase | Entrega | Módulos no portão |
|---|---|---|
| 0 | winget Node 24 + Git; repositório; `.mcp.json` do Context7; **reinício da sessão** | versões respondem, Context7 visível |
| 2 | Design system, home, schemas, seletores, spike de CSP | SM CT RS AC SG(CSP) |
| 3 | Seções 1–3, com leitura da IN 2.004 no texto oficial | + CN, quiz |
| 4 | Extração L12/L11 e explorador; amostra de 10% dos registros conferida campo a campo, mais todos os usados nos exemplos | + CN RS |
| 5 | 3 empresas e simulador (só AC normal, sem LC 224) | + CT de cálculo, CN |
| 6 | Novidades e monitor | + SG(SSRF, sanitização) |
| 7 | Busca, glossário, SEO, cabeçalhos finais | + CT busca, SG |
| 8 | Auditoria completa, relatório, preparo do deploy | todos |

Antes de cada biblioteca: consulta ao **Context7**, registrada em `docs/adr/`. Sem Context7 funcionando, a fase 2 não começa.

## Preciso de você
1. **Fase 0**: aceitar os avisos do Windows, reiniciar a sessão e aprovar o servidor Context7.
2. **Fase 4 em diante**: um contador para promover itens a "revisado". Eu só chego a "conferido". Sem isso, o site funciona, mas o selo diz isso claramente.
3. **Fases 6 e 8**: contas GitHub e Vercel, e o contato do `security.txt` (não usarei seu e-mail sem autorização). INLABS se quiser.

## Riscos
Volume de revisão (~190 registros × 2 leiautes); CSP com site estático; bloqueio de IP nas fontes; texto das normas só em SPA; pouca RAM (builds e testes em série).

## Verificação da próxima etapa (fases 0 e 2)
`node -v`, `npm -v`, `git --version` e Context7 respondendo; `npm run build`, `npm test`, `npm run e2e` e `npm audit --omit=dev` sem alta/crítica; home abre nos 4 tamanhos e 2 temas sem erro de console; nível e ano sobrevivem ao F5; CSP em Report-Only sem violação; parcial do `relatorio-testes-ecf.html` com 0 Crítica e 0 Alta.
