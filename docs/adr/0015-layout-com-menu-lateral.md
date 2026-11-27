# 0015. Layout com menu lateral (26/11/2026)

## Contexto

Prompt do layout (spec `docs/specs/layout-lateral.md`), que prevalece sobre os anteriores em layout e navegação. Referência de estrutura: um print de outro projeto, guardado fora do repositório. O objetivo é um site menos poluído: menos coisa no topo, menos caixas, navegação mais direta.

## Decisões

- **Menu fixo à esquerda** (`src/components/layout/lateral.tsx`):
  - 15rem de largura, com logo, busca, indicador de perfil, menu em grupos, aviso educacional e botões de tema e de recolher;
  - o item ativo é marcado com `aria-current`: `page` na própria área e `true` nas páginas filhas;
  - "Incentivos fiscais" entra no menu só com a etapa 4.
- **Recolhido (trilho de 4.5rem):**
  - a preferência `menu: "recolhido"` é aplicada antes da pintura (`prefs.js` → `data-menu`);
  - entre 1024 e 1279 px, o menu começa recolhido e abri-lo vale só até a próxima página, sem salvar;
  - os rótulos seguem a largura real da coluna por *container query*: ficam só para o leitor de tela, e a dica aparece com o mouse e com o foco do teclado.
- **Celular (abaixo de 1024 px):** barra fina com menu, logo e busca. O menu abre numa gaveta (`<dialog>` modal, com Esc e foco preso), e o conteúdo dela só existe enquanto ela está aberta.
- **Um só diálogo de busca e um só de perfil,** abertos por evento (`ecf:abrir-busca` e `ecf:abrir-perfil`), para que a coluna e a gaveta não dupliquem diálogos nem atalhos.
- **Ano, nível e regime só no perfil.** Saem do topo, e nenhum controle se repete na mesma tela. O filtro de regime em `/blocos` continua, porque é filtro de conteúdo.
- **Home no modelo da referência:**
  - card de destaque com o prazo, calculado no navegador pela regra `prazo-regra-geral`;
  - sem regra para o ano seguinte, o prazo aparece como "a confirmar", nunca com data inventada;
  - mini-quiz no canto, 4 cartões de números tirados dos dados e só 2 seções.
  - Saíram da home: o mapa de fluxo, o cartão de perfil e o "O que vale para o ano".
- **`/blocos`:** cartões no estilo dos de número, com letra grande, nome, registros e etiquetas. O objetivo do bloco virou dica (`title`) e está na página do bloco.
- **O explorador do fluxo (`Console`) saiu da home e foi para `/blocos`.** Lá ele ocupa o lugar do mapa simples, que continua só nas páginas de cada bloco.
  - O explorador tem botões de regime próprios, para filtrar o mapa. É uma exceção consciente à regra de não repetir controle: o filtro da grade de blocos e o do mapa trabalham em partes diferentes da página, e os dois partem do regime do perfil.
- **Registro:** com o menu à esquerda, o mapa do bloco aparece a partir de 1440 px; abaixo disso, fica o seletor.

## Consequências

- **Testes:** os que procuravam o menu, os seletores e o botão de perfil no topo foram reescritos para a coluna e o painel de perfil. Os testes novos ficam em `tests/e2e/layout.spec.ts`.
- **Painel de perfil:** trocar o ano passou a exigir um clique a mais (perfil → ano). É o preço de não repetir o controle em toda página.
