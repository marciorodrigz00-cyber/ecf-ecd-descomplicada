# 0012. Simulação de preenchimento, pilotos (26/11/2026)

## Contexto

O prompt de melhorias pede, na etapa 5, uma simulação parecida com um vídeo, mostrando como cada registro é preenchido. Combinamos fazer antes 4 pilotos (0035, 0000, M300 e L100), avaliar e só então escalar. Spec: `docs/specs/etapa-5-simulacao-pilotos.md`.

## Decisões

- **Componente interativo, não vídeo.** Sem dependência nova; Remotion e MP4 ficam de fora. O player é montado a partir dos dados do site e só é baixado (código e roteiro) quando a pessoa clica em "Iniciar a simulação".
- **Roteiro com só o que não sai dos dados**, em `content/roteiros/<bloco>/<registro>.json` (schema `Roteiro`): empresa, fatos, decisão, legendas, situação de cada regra e o cenário de erro. Tipo, tamanho, obrigatoriedade e texto das regras vêm do leiaute extraído. A linha `|REG|…|` é sempre gerada por código.
- **Origem dos valores.** O 0035 usa os dados de teste do Manual, com o TIP_ECF trocado para 1 e aviso na tela; a linha gerada precisa ser igual ao exemplo do Manual. Os outros três usam Móveis Aurora, a partir do mesmo arquivo que o site já monta.
- **Regras em código** em `src/lib/simulacao/regras.ts`, indexadas por `REG.CAMPO:CODIGO`. A spec previa `src/lib/validacao/regras/`; ficou junto da simulação porque só ela usa essas funções, e o arquivo precisa ser importável pelo hook sem atalhos de caminho. Dinheiro em centavos (`bigint`).
- **Toda regra do Manual aparece.** As que dependem de outro registro ausente, do programa ou de texto contraditório no Manual ficam como "não simulada", com o motivo. As contradições foram registradas em `content/divergencias.json`.
- **Conferência em três lugares.** O build monta cada roteiro e falha se o cenário normal falhar, se o erro não falhar na regra indicada ou se faltar regra. O hook de conteúdo confere o mesmo ao salvar (completo na origem `manual`). Os testes cobrem regras com casos feitos à mão.
- **Movimento reduzido vira lista** de passos, com o mesmo conteúdo. Teclado só com o foco no player, para não roubar a rolagem.
- **Agentes e skill** em `.claude/`: `roteirista-fiscal` (escreve só em `content/roteiros/`), `revisor-fiscal` (só leitura), `qa-tester` (só `tests/`) e a skill `roteiro-preenchimento`. Revisão por agente não muda o status: o máximo é "conferido".
- **Hook PreToolUse** passa a pedir aprovação para instalar pacote novo (`npm|pnpm i|install|add <pacote>`, `yarn add`). `npm install` e `npm ci` sem pacote continuam livres.

- **Linha explicada como padrão** (decidido depois dos pilotos): na seção "Veja o preenchimento", que substitui "Exemplo preenchido", cada campo da linha de exemplo é um botão. O painel ao lado mostra valor, formato, valores válidos, a leitura do Manual e as regras do campo. Vale para todo registro com exemplo decomponível, sem roteiro, e a lista completa fica recolhida embaixo. A animação passa a abrir pelo botão "Ver animado", só nos registros com roteiro.
- **Revisão fiscal dos pilotos** (agente `revisor-fiscal`). Correções:
  - O 0035 confere 14 caracteres e o 0000, 14 números, como diz cada texto.
  - Em situação especial, também vale o leiaute da coluna de situações especiais (2026 → 12).
  - `REGRA_NAO_PREENCHER_TIPO_DIFERENTE_E` em TIPO_LANCAMENTO e IND_RELACAO deixou de ser simulada: o texto só fala da linha E.
  - Na Móveis Aurora (TIP_ECF = 0), 0020.IND_QTE_SCP passou a vazio.
  - O validador de exemplos aceita campo "obrigatório" vazio quando o Manual tem, para ele, uma regra de não preencher.
  - O restante foi registrado em `content/divergencias.json`, para o contador.

## Consequências

- Cada roteiro novo custa um arquivo de conteúdo e, se tiver regra nova, uma função com testes. A escala para os demais registros depende da avaliação dos pilotos.
- O arquivo `out/dados/<ano>/roteiro-<registro>.json` é gerado só para registros com roteiro.
