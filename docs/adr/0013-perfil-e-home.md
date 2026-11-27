# 0013. Perfil de entrada e home enxuta (26/11/2026)

## Contexto

Etapa 2 do prompt de melhorias (spec `docs/specs/etapa-2-perfil-e-home.md`): o site deve se ajustar ao regime, ao nível e ao ano de quem o usa, e a home deve começar por dois caminhos claros.

## Decisões

- **Perfil nas preferências que já existiam** (`ecf:preferencias:v1`): ganham `regime` (lista fechada, os ids de `content/regimes.json`) e `perfil` ("respondido" ou "pulado"). Preferências antigas continuam válidas; valor fora da lista volta ao padrão.
- **Cartão no topo da home, sem janela por cima.** Para não piscar, o `prefs.js` (que já roda antes da pintura para tema e nível) marca `data-perfil="ok"`, e o CSS esconde o cartão. O botão "Meu perfil" no cabeçalho abre as mesmas perguntas num `<dialog>`. As perguntas só são montadas com a janela aberta: fechada, ela não repete campos da página.
- **Respostas valem na hora**, como o seletor de nível já fazia. "Pronto" e "Pular" só fecham. O ano é um link, como no cabeçalho (a URL continua sendo a fonte do ano).
- **Regime do perfil como padrão, nunca como trava.** O endereço vence: `?regime=real` mostra o lucro real mesmo com perfil de presumido, e `?regime=todos` é a escolha explícita de ver todos. No mapa da home, o regime deixou de ter padrão implícito no endereço, para que escolher "Lucro real" de propósito fique gravado.
- **Home:** os dois caminhos ("Estou aprendendo", que leva à próxima seção não estudada, e "Vou preencher"), depois prazo e programa, novidades e o mapa de fluxo. Trilha, conquistas e atalhos foram para `/meu-progresso`, que mostra um convite em vez de contadores em zero.
- **Menu:** O que é · Quem entrega · Blocos · Exemplos · Simulador · Novidades · Glossário · Fontes. "Importância" virou um link destacado dentro de "O que é", e o menu a marca como "O que é". "Incentivos fiscais" entra com a etapa 4.
- **Cartões de bloco:** número de registros, os cinco regimes com ícone e nome (situação por extenso para leitor de tela) e a situação para o regime escolhido com o vocabulário que a tabela do Manual sustenta: "Previsto para o seu regime", "Depende de uma condição", "Não se aplica ao seu regime".

## Consequências

- Os testes que procuravam conquistas, trilha e atalhos na home passaram a usar `/meu-progresso`.
- Links antigos com `?regime=` continuam funcionando; links sem o parâmetro passam a respeitar o perfil de quem abre.
