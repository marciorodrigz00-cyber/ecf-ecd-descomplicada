# Spec: Layout com menu lateral

Status: **aprovada** · 26/11/2026 (com as recomendações: Roteiro e Casos práticos no menu; Incentivos escondido até a etapa 4; prazo do AC 2026 "a confirmar"; novidades dos últimos 90 dias)

Origem: prompt do layout (menu lateral + home no modelo da referência), que prevalece sobre os prompts anteriores em layout e navegação.
Referência: um print de outro projeto, guardado fora do repositório (estrutura) e `docs/referencias/menu-atual.png` (menu de hoje, na gaveta).

## O que muda, em uma frase

O menu sai do topo e vira uma coluna fixa à esquerda, com ícones. Busca, perfil e tema vão para essa coluna. A home fica com um card de destaque, 4 cards de números e só 2 seções.

## O que copiar da referência

- **Copio:** a estrutura, as proporções e o comportamento.
  - Coluna de cerca de 240 px, num tom diferente do conteúdo e com linha divisória.
  - Itens com ícone, item ativo com barra vertical na borda esquerda.
  - Aviso pequeno no rodapé da coluna.
  - Card de destaque e linha de 4 cards de números.
- **Não copio:** a decoração de Natal, o tema de futebol, a marca, o logo e os textos.
- **Cores:** as do site, com os tokens atuais e os temas claro e escuro. A referência é escura, mas o tema claro precisa ficar tão bom quanto ela.

## 1. Menu lateral

### Itens

| Grupo | Item | Vai para | Ícone (lucide) |
|---|---|---|---|
| — | Visão geral | `/` | LayoutDashboard |
| APRENDER | O que é a ECF | `/o-que-e` (Importância dentro) | BookOpen |
| | Quem entrega | `/quem-deve-entregar` | CircleHelp |
| | Glossário | `/glossario` | BookA |
| PREENCHER | Blocos e registros | `/blocos` | Blocks |
| | Roteiro de preenchimento | `/preencher` | ListChecks |
| | Casos práticos | `/exemplos` | Building2 |
| | Simulador | `/simulador` | Calculator |
| INCENTIVOS | Incentivos fiscais | entra na etapa 4 | BadgePercent |
| ATUALIZAÇÕES | Novidades | `/novidades` | Bell |
| | Fontes e verificações | `/fontes` | ShieldCheck |

**Dois pontos para você decidir:**

1. **"Caso prático guiado".** O prompt tem esse item, mas o site hoje tem duas páginas que podem ocupar o lugar:
   - o roteiro passo a passo por regime (`/preencher`);
   - as três empresas fictícias (`/exemplos`), que no menu atual são "Exemplos".

   O prompt não cita nenhuma das duas. **Minha recomendação** é manter as duas no grupo PREENCHER, como na tabela: "Roteiro de preenchimento" e "Casos práticos". Se uma delas sair do menu, fica sem caminho.
2. **"Incentivos fiscais".** A página só existe depois da etapa 4. **Minha recomendação** é que o grupo INCENTIVOS não apareça até lá: nada de item "em breve" que não leva a lugar nenhum.

**"Meu progresso"** (criado na etapa 2) não está no prompt. Ele vai para o painel do perfil, como link "Ver meu progresso", e continua no card "Comece por aqui" da home.

### Topo da coluna

1. **Logo** "ECF e ECD descomplicada" (o atual), levando a `/`.
2. **Campo "Buscar… Ctrl K"**, que abre a busca global, a mesma de hoje.
3. **Indicador de perfil clicável:** "• AC 2025 · Leiaute 12 · Iniciante". Abre o painel de perfil (regime, ano, nível) que já existe. O ano vem da URL e o leiaute, do ano.

### Rodapé da coluna

- **Caixa de aviso:** "Conteúdo educacional. Confirme na legislação e com a Receita Federal." e o link "Fontes e verificações".
- **Botão de tema** claro/escuro.
- **Botão "Recolher menu"**.

### Comportamento

- **Ícone e rótulo** formam um só link, com no mínimo 44 px de altura.
- **Item ativo** também nas páginas filhas:
  - "Blocos e registros" em `/blocos/0` e `/blocos/0/0035`;
  - "O que é" em `/importancia`;
  - "Novidades" em `/novidades/x`;
  - "Casos práticos" em `/exemplos/lucro-real`.

  Vale também com `/ac/2024/…`.
- **Subnível dos blocos:** só na área de Blocos, abaixo do item, aparece a lista compacta dos 17 blocos (0, C, E, J, K, L, M, N, P, Q, T, U, V, W, X, Y, 9).
  - Cada bloco tem a letra, a cor do grupo e o nome curto.
  - O bloco atual fica destacado com `aria-current`.
  - Os registros não entram na coluna: ficam na página do bloco e no mapa do bloco do registro (etapa 3).
- **Modo recolhido (trilho de 72 px):**
  - mostra só os ícones;
  - cada ícone tem dica com o nome, que aparece com o mouse e com o foco do teclado, e continua navegando;
  - o subnível dos blocos vira só as letras;
  - a escolha fica salva nas preferências (`menu: "aberto" | "recolhido"`) e é aplicada antes da primeira pintura, pelo `prefs.js`, sem piscar.

### Acessibilidade

- **Marcação:** `<nav aria-label="Menu principal">`, com `<ul>` por grupo e o rótulo do grupo como cabeçalho ligado por `aria-labelledby`.
- **Item ativo:** `aria-current="page"`.
- **Foco e teclado:** foco visível, ordem do teclado: coluna → conteúdo. O link "Pular para o conteúdo" continua.
- **Botão de recolher:** `aria-expanded`, e o rótulo muda entre "Recolher menu" e "Expandir menu".

## 2. Topo

- **Computador (1024 px ou mais):** sem barra superior. O conteúdo começa direto.
- **Breadcrumb:** "Você está em" continua, como primeira linha do conteúdo, nas páginas internas. Os testes e o leitor de tela dependem dele.
- **Celular (abaixo de 1024 px):** barra fina com:
  - botão de menu, que abre a coluna como gaveta à esquerda (`<dialog>` modal: fundo escurecido, foco preso dentro e fechamento por Esc ou no X);
  - logo;
  - ícone de busca.
- **Saem do topo:** seletor de ano, seletor de nível, botão de tema, botão de perfil, "ECD em breve" e a linha de menu.
- **Ano, nível e regime** passam a mudar só no painel de perfil.
- **Exceções que ficam:**
  - o seletor de ano dentro da página de registro, que mostra o que mudou entre leiautes;
  - o filtro de regime em `/blocos`, que é um filtro de conteúdo, não uma preferência.

  Os dois são revistos para não repetir controle na mesma tela.

## 3. Home (Visão geral)

### Card de destaque (largura toda)

- **Sobrelinha:** "ECF 2026 —— ANO-CALENDÁRIO 2025", com o ano do perfil ou da URL.
- **Título** em duas linhas: "A ECF," e, na cor de destaque, "SEM COMPLICAÇÃO."
- **Subtítulo** de uma linha: "Entenda o arquivo, prepare cada bloco e confira as regras na fonte."
- **Número grande:** "N dias para o prazo da ECF".
  - Calculado da regra `prazo-regra-geral` ("último dia útil de julho do ano seguinte"), que já tem fonte.
  - O último dia útil é o último dia de semana de julho: julho não tem feriado nacional. Esse cálculo é derivado, então a legenda diz "pela regra do art. 3º da IN RFB 2.004/2021", com link.
  - **Situação hoje (26/11/2026):** o prazo do AC 2025 (31/07/2026) já passou. A regra cadastrada só vale para os AC 2024 e 2025, então o AC 2026 aparece sem contagem: "Próximo prazo: AC 2026, a confirmar quando sair a norma". Não invento data.
  - A conta é feita no navegador, com a data do dia. O HTML gerado traz o texto sem o número, para não congelar a data do build.
- **Widget no canto: "Minha empresa precisa entregar?"**
  - Uma pergunta e o botão de destaque "Descobrir", que leva ao quiz.
  - Se a pessoa já tem progresso, o widget vira "Continue de onde parou", com o próximo passo.
- **Fundo:** linhas de um arquivo SPED estilizadas (`|0000|LECF|…`) em baixo contraste, só decorativas (`aria-hidden`), sem animação. Não pioram o contraste do texto, e o axe confere.

### 4 cards de números (todos vêm dos dados)

| Rótulo | Número | Legenda | Leva a |
|---|---|---|---|
| BLOCOS COBERTOS | 17 | do leiaute 12 | `/blocos` |
| REGISTROS EXPLICADOS | registros com linha explicada (hoje, 178) | com exemplo de preenchimento | `/blocos` |
| ÚLTIMA REVISÃO | data da verificação mais recente das fontes | fontes oficiais conferidas | `/fontes` |
| NOVIDADES | quantidade nos últimos 90 dias | ver o que mudou | `/novidades` |

- **Card NOVIDADES:** o prompt pede "no mês", mas em novembro de 2026 ainda não há nenhuma, e o card mostraria "0". Por isso proponho "nos últimos 90 dias". Se você preferir o mês, eu troco.
- **Destaque:** só o card de registros tem fundo de destaque suave.
- **Colunas:** 4 no computador, 2 abaixo de 1024 px e 1 em 375 px.

### Seções abaixo dos cards (no máximo 2)

1. **"Comece por aqui":**
   - os dois caminhos que já existem: "Aprender", com o próximo tema não estudado, e "Preencher", que leva ao roteiro;
   - abaixo, um link discreto "Ver meu progresso".
2. **"Novidades":** as 3 mais recentes e o link "Todas as novidades".

**Saem da home:**
- o cartão de perfil: o indicador da coluna faz o papel dele;
- o mapa de fluxo, que fica em `/blocos`;
- conquistas, trilha e atalhos, que ficam em `/meu-progresso`;
- "O que mudou agora", que fica em `/novidades`.

## 4. Demais páginas (segunda parte, depois da sua aprovação)

- **Esqueleto:** coluna + conteúdo com título, caixa "Em resumo" (onde já existe) e o conteúdo.
- **`/blocos`:**
  - grade de cards no estilo dos cards de números: letra grande na cor do grupo, nome e etiquetas de situação, sem texto longo;
  - mapa de fluxo e filtro de regime continuam abaixo.
- **Registro:** mantém "Nesta página", anterior/próximo, mapa do bloco e o player.
  - Como agora há menu à esquerda, o mapa do bloco do registro passa a aparecer só a partir de 1440 px.
  - Abaixo disso, fica o seletor "Ir para o registro".
  - Assim não ficam três colunas apertadas.

## 5. Regras de limpeza

- No máximo 1 card de destaque por página e 4 cards por linha.
- Um nível de caixa só: nada de caixa dentro de caixa. As seções se separam por espaço.
- Rótulo pequeno em maiúsculas só em sobrelinhas e cabeçalhos de card.
- Uma cor de destaque (a `marca` atual). As cores dos grupos de blocos aparecem só na área de blocos.
- Nenhum controle repetido na mesma tela: um teste confere que ano, nível e tema aparecem uma vez só.

## 6. Larguras

| Largura | Coluna |
|---|---|
| 1280 px ou mais | aberta (240 px); recolhível |
| 1024 a 1279 px | recolhida (72 px) por padrão; expansível |
| menos de 1024 px | gaveta e barra fina; cards em 2 colunas, e em 1 coluna em 375 px |

- **Entre 1024 e 1279 px**, expandir a coluna é só uma escolha temporária: a coluna aberta fica por cima do conteúdo e fecha ao navegar. Só a escolha feita a partir de 1280 px fica salva.

## Implementação

- **Arquivos:**
  - `src/components/layout/lateral.tsx` (novo): coluna, grupos, subnível, recolher, gaveta;
  - `cabecalho.tsx` fica só com a barra do celular, o breadcrumb e a lógica de foco e rolagem que já existe;
  - `layout.tsx` muda para grade `[coluna][conteúdo]`;
  - `src/paginas/index.tsx` reescrita;
  - `prefs.js` e `modelo.ts` ganham `menu`.
- **Rodapé atual:** o aviso educacional vai para a coluna. O texto completo do rodapé (ECD, sem vínculo com a RFB) continua no fim do conteúdo, menor.
- **Ícones:** só lucide-react, que o projeto já usa. Nada novo para instalar.
- **ADR 0015:** layout com menu lateral.

## Testes

- **CT:**
  - cada item da coluna leva à área certa;
  - item ativo nas páginas filhas e no AC 2024;
  - subnível dos blocos só na área de Blocos, com o bloco atual marcado;
  - recolher e expandir, com a escolha mantida depois do F5 e sem piscar;
  - números da home iguais aos dados;
  - prazo: com data simulada antes e depois de 31/07/2026;
  - widget do quiz com e sem progresso.
- **AC:**
  - axe na home, `/blocos`, um registro e `/fontes`, nos dois temas, com a coluna aberta e recolhida;
  - dica do modo recolhido pelo teclado;
  - gaveta com foco preso e Esc;
  - `aria-current`.
- **RS:**
  - 375, 768, 1024, 1050, 1280 e 1440 px sem rolagem lateral;
  - alvos de 44 px na coluna;
  - cards em 1, 2 e 4 colunas.
- **Testes antigos:** os que procuram o menu no topo, os seletores do cabeçalho ou as seções antigas da home serão reescritos. Listo quais no relatório.
- **Relatório:** seção "antes × depois" em `relatorio-testes-ecf.html`, com as capturas.

## Entrega em duas partes

1. **Coluna e home:**
   - capturas em 375, 1024 e 1440 px, nos temas claro e escuro;
   - **paro para você aprovar**.
2. **Demais páginas:** o esqueleto em todas, os testes, o relatório e a revisão de UX.

## Fora do escopo

- Conteúdo novo, a página de incentivos (etapa 4) e o Bloco S.
- Animações novas.
- Publicar ou fazer commit sem pedir.
