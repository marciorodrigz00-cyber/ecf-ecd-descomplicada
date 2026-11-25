# Requisitos originais (na íntegra)

Papel

Você é um engenheiro de software full-stack sênior e designer de produto, com conhecimento de contabilidade tributária brasileira (SPED, ECD, ECF, IRPJ, CSLL). Vamos construir juntos, em etapas, uma plataforma web educacional e prática sobre a ECF (Escrituração Contábil Fiscal).

Objetivo do projeto

Criar uma plataforma que facilite entender e preparar a ECF. Ela atende dois públicos:

Iniciantes: nunca tiveram contato com ECF e precisam de linguagem simples, analogias e um passo a passo guiado.
Profissionais: contadores e analistas fiscais que querem consulta rápida, detalhes técnicos de registros e campos, e novidades da legislação.

A interface deve ter um seletor de nível ("Estou começando" / "Já conheço") que ajusta a profundidade do conteúdo em toda a plataforma.

Seções obrigatórias
O que é a ECF: definição, origem (substituiu a DIPJ), relação com a ECD e o e-Lalur/e-Lacs, e onde ela fica no ecossistema SPED. Inclua uma linha do tempo interativa.
Importância: para que serve ao Fisco e à empresa, cruzamentos de dados, riscos e multas por atraso ou erro (sempre citando o dispositivo legal vigente).
Quem deve entregar: um quiz interativo ("Minha empresa precisa entregar?") que considera regime de tributação (Lucro Real, Presumido, Arbitrado, imunes e isentas, Simples Nacional, inativas, SCP etc.) e explica o porquê de cada resultado.
Blocos e como preencher: um explorador navegável de todos os blocos (0, C, E, J, K, L, M, N, P, Q, T, U, V, W, X, Y, 9). Para cada bloco, mostre:
objetivo em linguagem simples (modo iniciante);
registros, campos, regras de validação e obrigatoriedade por regime (modo profissional);
erros comuns e como evitá-los;
um diagrama mostrando de onde vêm os dados (ECD → ECF) e como os blocos se relacionam.
Exemplos fictícios: pelo menos 3 empresas fictícias completas (por exemplo, uma do Lucro Real com adições e exclusões no e-Lalur, uma do Lucro Presumido e uma imune ou isenta), com números coerentes, registros preenchidos e explicação de cada linha. Inclua um simulador simples de apuração de IRPJ/CSLL que mostre o cálculo passo a passo. Deixe claro que os dados são fictícios e servem só para estudo.
Novidades e legislação: um feed de atualizações (novas versões do leiaute, INs, prazos, mudanças no PVA), com data, resumo e link para a fonte oficial.
Glossário e busca global: termos técnicos com tooltip em todo o site, mais uma busca rápida (atalho Ctrl+K) por bloco, registro, campo ou termo.
Atualização da legislação (requisito central)
Toda regra, prazo, alíquota ou dispositivo legal deve ficar em arquivos de dados versionados (MDX/JSON), nunca escrito direto nos componentes. Cada item deve ter: fonte oficial (URL), norma, versão do leiaute, ano-calendário de vigência e data da última verificação.
Crie um módulo/job agendado que monitore as fontes oficiais: Portal SPED (sped.rfb.gov.br), Manual de Orientação do Leiaute da ECF, Instruções Normativas da RFB (base: IN RFB nº 2.004/2021 e alterações) e o Diário Oficial da União. Quando detectar uma mudança, o job gera um rascunho de atualização para revisão humana. Nada é publicado automaticamente.
Mostre na interface o selo "Atualizado conforme leiaute X, verificado em DD/MM/AAAA".
Suporte a múltiplos anos-calendário: o usuário escolhe o ano e vê as regras daquele período.
Uso do MCP Context7

Use o MCP do Context7 antes de instalar, configurar ou alterar o uso de qualquer biblioteca do projeto (Next.js, React, Tailwind, Framer Motion, bibliotecas de busca, gráficos e diagramas), para consultar a documentação mais recente. Não use APIs obsoletas. O Context7 NÃO é fonte de legislação: o conteúdo fiscal vem só das fontes oficiais acima.

Stack sugerida (pode propor alternativas justificando)
Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Framer Motion para animações e transições
Conteúdo em MDX com schemas validados (Zod)
Busca local (por exemplo, FlexSearch ou Pagefind)
Diagramas com React Flow ou Mermaid
Job de monitoramento com GitHub Actions ou cron serverless
Pronto para deploy na Vercel; SEO, sitemap e Open Graph configurados
Estética e experiência
Visual moderno, limpo e confiável, com cara de produto fintech e não de site governamental.
Tema claro e escuro, tipografia legível, bastante espaço em branco e cores de destaque por bloco da ECF (cada bloco com sua cor e ícone).
Interatividade com propósito: cards expansíveis, stepper de preenchimento, quiz, simulador, barra de progresso de estudo (salva localmente) e microanimações discretas.
Responsivo (mobile first) e acessível (WCAG 2.1 AA: contraste, navegação por teclado, aria-labels).
Tudo em português do Brasil.
Regras de qualidade
Nunca invente regras fiscais. Se não tiver certeza, marque como "a verificar" e aponte a fonte oficial a ser conferida.
Rodapé e páginas de exemplo com o aviso: "Conteúdo educacional; não substitui orientação de profissional contábil nem a legislação oficial."
Código organizado, componentizado, com testes nas partes de cálculo do simulador e na validação dos dados.
Validação de qualidade (plano de testes obrigatório)

A qualidade do projeto será medida pelos parâmetros abaixo, baseados num relatório de testes de referência. Construa já pensando nesses testes e, ao final, entregue um relatório no formato descrito.

Módulos e prefixos dos casos de teste

Cada caso recebe um ID com o prefixo do módulo e numeração sequencial (ex.: CT-001).

SM — Smoke: todas as seções carregam sem erros de JavaScript (nenhum pageerror ou console.error); o conteúdo é carregado; o selo de leiaute e a data de verificação aparecem.
CT — Funcional:
o menu troca a seção, marca o item ativo e o breadcrumb acompanha;
toda seção nova abre no topo da página (scrollTo(0,0) ou foco no h1);
cada seção tem URL própria (ex.: /blocos/m): F5 mantém a seção, o botão Voltar leva à seção anterior e dá para compartilhar o link;
o seletor de nível (iniciante/profissional) e o de ano-calendário mudam o conteúdo em todo o site e persistem após o F5;
o quiz "Quem deve entregar" dá o resultado certo e explicado para cada regime, com um caso de teste por regime;
o simulador de IRPJ/CSLL é testado com casos calculados à mão (incluindo valores zero, negativos, prejuízo fiscal e limites de faixa), e os resultados batem;
a busca aceita maiúsculas/minúsculas, acentos e ausência de acentos, códigos de registro (ex.: "M300", "m300") e espaços extras; a busca vazia restaura a lista;
a busca sem resultado mostra a mensagem certa ("Nenhum resultado para 'xyz'"), nunca o texto de outro estado vazio;
filtros e buscas não renumeram itens: a ordem ou posição original é calculada antes de filtrar;
comparações ou seletores duplos não aceitam a mesma opção nos dois lados;
o progresso de estudo e as preferências persistem após o F5;
cliques duplos e ações repetidas não quebram o estado (quiz, simulador, stepper).
CN — Conteúdo e consistência fiscal:
toda regra fiscal tem fonte oficial, norma, versão do leiaute e data de verificação;
os exemplos fictícios são internamente coerentes (balanço fecha, adições e exclusões do e-Lalur somam certo, totais dos blocos batem com os registros);
formatação pt-BR centralizada com Intl.NumberFormat('pt-BR') e Intl.DateTimeFormat('pt-BR'): decimal com vírgula, milhar com ponto, R$, datas DD/MM/AAAA, ordinais com "º". O mesmo número nunca aparece com formatos diferentes;
nenhum texto cru em inglês ou vindo direto das fontes sem tratamento;
campos que não se aplicam mostram "—" ou "não se aplica", nunca 0 (zero só quando o valor é de fato zero).
RS — Responsividade: testar em 375 px, 768 px, ~1050 px e 1440 px.
nenhuma rolagem horizontal na página (scrollWidth ≤ clientWidth em todas as seções);
tabelas largas de registros e campos têm rolagem própria e evidente, sem cortar o conteúdo;
elementos de largura fixa (diagramas, linhas do tempo) escalam ou quebram linha;
alvos de toque com no mínimo 24 px no mobile.
AC — Acessibilidade (WCAG 2.1 AA):
navegação completa só por teclado, com foco visível e ordem lógica;
link "pular para o conteúdo" e aria-current="page" no item de menu ativo;
lang="pt-BR", landmarks e hierarquia de títulos h1 → h2 → h3;
todo controle tem nome acessível: botões só com ícone usam aria-label ou texto .sr-only (nunca display:none no único texto do botão);
imagens com alt (as decorativas com alt="");
contraste mínimo de 4,5:1;
prefers-reduced-motion respeitado e animações que podem ser pausadas;
quiz e tooltips do glossário anunciados corretamente pelo leitor de tela.
RD — Rede/API e Storage:
nenhuma chamada duplicada para o mesmo recurso na mesma carga;
conteúdo legislativo gerado em build (estático) sempre que possível;
cache local que cabe na cota: guardar só os campos usados, usar IndexedDB para payloads grandes e nunca gerar QuotaExceededError;
medir e registrar o número de requisições e o volume (MB) da primeira carga.
SG — Segurança (não destrutiva):
cabeçalhos no vercel.json ou next.config: Content-Security-Policy restritiva (testar antes em modo Report-Only), frame-ancestors 'none', X-Frame-Options: DENY, Permissions-Policy, Cross-Origin-Opener-Policy, HSTS com preload, X-Content-Type-Options: nosniff, Referrer-Policy e nenhum X-Powered-By;
XSS: testar a busca e os campos de entrada com payloads (img onerror, svg onload, quebra de aspas, javascript:, {{7*7}}, ${7*7}); nenhum dangerouslySetInnerHTML/innerHTML sem sanitização; zero eval/new Function;
o conteúdo vindo do monitoramento de fontes externas (RFB, DOU, SPED) é sanitizado antes de virar rascunho;
job de monitoramento sem SSRF: só acessa domínios de uma allowlist (gov.br e afins); path traversal e hosts arbitrários são recusados;
rotas de API somente leitura: só GET (405 com Allow: GET para o resto); parâmetros validados (400 para traversal e CRLF);
rate limit e cache de borda (s-maxage + stale-while-revalidate) nas rotas de API; nenhum parâmetro público que force a revalidação;
erros genéricos para o cliente, com o detalhe registrado só no servidor; nenhum stack trace, caminho interno ou mensagem crua de serviço externo;
nada exposto: .env, .git, source maps, package.json e código do servidor respondem 404;
nenhum segredo ou token no bundle; os tokens do job ficam em variáveis de ambiente/secrets;
recursos de terceiros com SRI ou servidos do próprio domínio;
o painel de revisão de rascunhos (se existir) exige autenticação, e nenhuma alteração é publicada sem aprovação humana;
/.well-known/security.txt publicado e npm audit --omit=dev sem vulnerabilidades altas ou críticas.
Regras de execução: só no domínio do próprio projeto, só GET/HEAD, rajada máxima de 20 requisições e provas inofensivas.
Severidade dos defeitos
Crítica: quebra o site, expõe dados ou segredos, permite execução de código ou publica legislação sem revisão humana.
Alta: regra fiscal errada ou sem fonte, resultado errado no quiz ou no simulador, uma seção principal inutilizável, ou falha de segurança explorável.
Média: problema de usabilidade, responsividade ou acessibilidade que atrapalha a tarefa; ausência de uma barreira de segurança (ex.: CSP); risco de disponibilidade ou custo.
Baixa: formatação, textos, cabeçalhos complementares e melhorias menores.
Critérios de veredicto
Aprovado: todos os casos passaram ou só há defeitos Baixa.
Aprovado com ressalvas: 0 Crítica e 0 Alta; os defeitos Média estão documentados com a correção proposta.
Reprovado: qualquer defeito Crítico ou Alto. Não avance para o deploy com veredicto "Reprovado".
Formato do relatório de testes

Gere relatorio-testes-ecf.html (autocontido, em pt-BR) com:

Cabeçalho: data e horário de execução, ambiente (URL), navegador e larguras testadas, escopo autorizado e módulos executados.
Resumo executivo: total de casos, passaram, falharam, bloqueados, número de defeitos por severidade (separando os de segurança), veredicto, um parágrafo em linguagem simples sobre o risco real e as prioridades.
Defeitos encontrados: lista única ordenada por severidade, cada um com ID BUG-NNN, título, severidade, etiquetas de módulo, casos ligados, passos para reproduzir, resultado esperado, resultado obtido (com números medidos), observações técnicas (arquivo/linha, impacto, correção sugerida com código) e evidência (captura de tela quando visual).
Casos de teste executados: tabela com ID, Módulo, Caso de teste, Resultado obtido e Status (Passou / Falhou / Bloqueado), ligando cada falha ao BUG correspondente.
Recomendações: controles aprovados (o que está bom) e ações por prioridade.
Fora do escopo verificado: o que não foi testado e por quê (ex.: leitor de tela real, dispositivos físicos, outros navegadores), e o que foi reaproveitado de execuções anteriores sem reexecutar.
Quando testar
Ao fim de cada fase, rode os módulos que se aplicam ao que foi construído e corrija os defeitos Críticos e Altos antes de pedir aprovação.
Automatize o que der: testes unitários (Vitest) para o simulador e os schemas, testes de ponta a ponta (Playwright) para os fluxos funcionais, de responsividade e de URL, axe-core para acessibilidade e Lighthouse para desempenho.
Ao reexecutar, indique no relatório quais casos foram revalidados e quais foram reaproveitados de uma execução anterior.
Forma de trabalho

Trabalhe em fases e só avance para a próxima depois da minha aprovação:

Proponha a arquitetura, a estrutura de pastas, o modelo de dados do conteúdo, o mapa do site e a estrutura dos testes.
Monte o design system (cores, tipografia, componentes base) e a home.
Construa as seções 1 a 3.
Construa o explorador de blocos (seção 4).
Construa os exemplos e o simulador (seção 5).
Construa o feed de legislação e o job de monitoramento (seção 6).
Adicione a busca, o glossário, o SEO e os cabeçalhos de segurança.
Rode a auditoria completa (todos os módulos), gere o relatorio-testes-ecf.html, corrija o que for necessário e só então prepare o deploy.

Comece pela fase 1.
