# 0016. Incentivos fiscais e a LC nº 224/2025 (27/11/2026)

## Contexto

Etapa 4 do prompt de melhorias (spec `docs/specs/etapa-4-incentivos-lc-224.md`, aprovada com as três recomendações). A pesquisa achou a LC nº 239/2026, publicada em 24/11/2026, que dobra a redução a partir de 2027, e ainda não há orientação da Receita Federal sobre ela.

## Decisões

- **Fichas em `content/incentivos/<id>.json`** (schema `Incentivo`), com:
  - situação (`reduzido`, `excetuado`, `nao-beneficio`, `a-verificar`) e o porquê, com dispositivo;
  - efeito por ano-calendário (`porAno`);
  - registros da ECF, situação judicial e exemplo opcional.
  - O carregador e o hook conferem que fontes, regras e registros existem.
- **Duas camadas por ano:**
  - AC 2026, com 10%, conferida no texto da lei, na IN 2.305 e no Perguntas e Respostas;
  - AC 2027, com 20% pela LC 239, sempre "a verificar" até a Receita se manifestar.
  - Motivo de a camada de 2027 ficar inteira "a verificar": a LC 239 também troca o demonstrativo de gastos tributários de referência pelo da LOA de cada ano.
- **Regras com vigência de situação especial:** as regras do AC 2026 (`content/regras/lc224.json`) usam `situacaoEspecial: [2026]` e o leiaute 12, porque é o Manual do leiaute 12 que documenta a lei. Assim a rastreabilidade fecha com a tabela oficial sem inventar um leiaute 13.
- **Fichas "a verificar" publicadas com selo e com o campo `falta`:** SUDAM/SUDENE, audiovisual, fundos da criança e do idoso, PRONON/PRONAS. Regimes ficam vazios quando as fontes lidas não dizem quais podem usar.
- **Cálculo em `src/lib/calculo/lc224.ts`** (presunção acrescida, repartição do limite, dedução limitada), testado com os exemplos oficiais.
  - O simulador ganhou o modo "AC 2026, com a LC 224" só no lucro presumido, por trimestre.
  - O modo não simula a sobra de limite entre trimestres nem o ajuste do último trimestre (IN 2.305, art. 15, §§ 4º e 5º); a ficha explica.
- **Páginas:**
  - `/incentivos` (hub com filtros no endereço) e `/incentivos/<id>`, iguais em qualquer ano;
  - `/novidades/lc-224-2025` com linha do tempo e "o que muda na ECF";
  - selo "Incentivos neste registro" em registros e blocos;
  - aviso na home para quem marcou lucro presumido no perfil;
  - item "Incentivos fiscais" no menu lateral, com o ícone `BadgePercent`.
- **Nada de número ou nome de norma nos componentes:** percentuais, limites e datas vêm das regras, e nomes de norma vêm do catálogo de fontes. Os guardas CN-004 e CN-034 continuam valendo.
- **Fontes novas:**
  - LC 224, LC 235, LC 239, Decreto 12.808, IN 2.305 e Perguntas e Respostas v5;
  - notícias do STF, com `noticias.stf.jus.br` acrescentado à lista de domínios oficiais.
  - A IN 2.305 só abre em navegador; o monitor a lê pela API do portal de normas, como a IN 2.004.
- **Divergência no Manual:** 0020.IND_ALIQ_CSLL descreve as opções 7 e 8 (alíquotas transitórias da CSLL), mas os valores válidos continuam [1;3;4].
- **Agente e skill:** `pesquisador-legislacao` e a skill `ficha-incentivo`. O hook de conteúdo ganhou o modo `incentivo`.

## Consequências

- O seletor de ano continua com 2024 e 2025, e as páginas de incentivos dizem a que ano-calendário cada informação se aplica.
- Quando a Receita publicar orientação sobre a LC 239, a camada de 2027 sai de "a verificar" ficha a ficha.
- Com a LOA de 2027, as fichas precisam ser revistas.
