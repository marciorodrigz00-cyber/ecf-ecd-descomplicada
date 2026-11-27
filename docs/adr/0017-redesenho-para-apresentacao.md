# 0017. Redesenho para apresentação à gerência (27/11/2026)

## Contexto

Prompt de refatoração visual: um visual sóbrio, objetivo e acessível, com a imagem de referência enviada pelo usuário. Ficam iguais o conteúdo técnico, as rotas e a lógica de busca, progresso e simulador; o prompt pede só layout, hierarquia e estilo. Esta ADR complementa a 0015.

## Decisões

- **Coluna lateral:**
  - fixa na altura da tela, com logo e botão de recolher no topo e perfil e tema no rodapé; só a lista de navegação rola;
  - ícones Lucide de 20 px com traço 1,5;
  - recolhida, ela tem 64 px.
  - O grupo "Incentivos" (etapa 4) continua, entre Preencher e Atualizações.
  - O aviso educacional saiu da coluna e ficou no rodapé da página.
- **Navegação:** o `nav` passa a se chamar "Principal", como pede o prompt.
- **Barra superior fixa (`BarraTopo`):**
  - a busca fica centralizada na área de conteúdo, com largura máxima de 560 px e o texto "Buscar registro, bloco ou termo…" mais Ctrl K;
  - no celular, a mesma barra traz o botão de menu e a marca; a gaveta é aberta pelo evento `ecf:abrir-menu`.
- **Topo da home:**
  - título "ECF sem complicação" em fonte sem serifa, sem caixa alta e sem verde;
  - card "Próxima entrega", com a ECF e o ano-calendário seguintes e o prazo pela regra geral; sem regra para o ano, o prazo aparece "a confirmar em norma";
  - card "Sua trilha", com botão principal.
  - Saíram o fundo decorativo com linhas do arquivo e a sobrelinha "ECF 2026 —— ANO-CALENDÁRIO 2025".
- **Números:** quatro cartões compactos, com número e rótulo:
  - blocos, registros com exemplo, última revisão e versão do programa, como na imagem de referência;
  - a cor de destaque fica só nos dois números-chave.
- **Seções:**
  - "Comece por aqui" com três cartões: aprender, preencher e "Minha empresa precisa entregar?". O quiz saiu do topo e ficou aqui, como na imagem.
  - Novidades numa lista simples dentro de um cartão.
- **Sistema visual:**
  - fundo escuro #0E0F0C, com o tema claro mantido;
  - fonte Inter para texto, servida pelo próprio site via next/font, e IBM Plex Mono só para código;
  - cartões com raio de 12 px e borda de 1 px, sem sombra;
  - conteúdo com largura máxima de 1120 px.
- **"ECD em breve":** a marca do aviso saiu do logo e foi para o rodapé, ao lado do aviso sobre a ECD.

## Consequências

- Os testes que procuravam o título antigo, o card do quiz no topo e o `nav` "Menu principal" foram atualizados.
- O RS-015 confere a coluna fixa, a busca centralizada e a ausência de sobreposição em 375, 1024 e 1440 px.
