# Validação do conteúdo existente pelo hook 1

25/11/2026. Conteúdo das fases 1 a 5. Para repetir: `npm run validar:conteudo`.

| | Antes | Depois |
|---|---|---|
| Arquivos | 59 | 60 (entrou `leiautes/anos.json`) |
| Itens reprovados | 120 | 0 |
| Itens ou trechos "a verificar" | 1 | 8 |

Os 7 trechos a mais já estavam marcados no conteúdo. O hook passou a listá-los.

## O que não passava

| Arquivo | Itens | Quais | O que faltava |
|---|---|---|---|
| `content/blocos.json` | 1 | arquivo inteiro | schema de arquivo não exportado |
| `content/divergencias.json` | 1 | arquivo inteiro | Os cinco campos, no nível do arquivo |
| `content/fontes.json` | 1 | arquivo inteiro | schema de arquivo não exportado |
| `content/grafo.json` | 1 | arquivo inteiro | Os cinco campos, no nível do arquivo |
| `content/legendas.json` | 1 | arquivo inteiro | Os cinco campos, no nível do arquivo |
| `content/leiautes/11/registros/*.json` | 17 | 0, 9, C, E, J, K, L, M, N, P, Q, T, U, V, W, X, Y | Os cinco campos, no nível do arquivo |
| `content/leiautes/12/registros/*.json` | 17 | 0, 9, C, E, J, K, L, M, N, P, Q, T, U, V, W, X, Y | Os cinco campos, no nível do arquivo |
| `content/leiautes/12/tabelas.json` | 1 | arquivo inteiro | Os cinco campos, no nível do arquivo |
| `content/linha-do-tempo.json` | 8 | t-sped, t-in1422, t-dipj, t-imunes, t-caixa, t-in2004, t-l11, t-l12 | versão do leiaute; ano-calendário |
| `content/programa.json` | 1 | programa-ecf | versão do leiaute; ano-calendário |
| `content/regimes.json` | 1 | arquivo inteiro | Os cinco campos, no nível do arquivo |
| `content/regras/definicao.json` | 13 | ecf-conteudo, ecf-lalur, substitui-dipj, recupera-ecd, recupera-ecf-anterior, plano-referencial, e-lalur, e-lacs, controle-saldos, livro-caixa, manual-cofis, assinatura, sped | versão do leiaute |
| `content/regras/multas.json` | 12 | multa-qual, multa-real-atraso, multa-real-erro, multa-real-limite, multa-real-reducao, multa-real-erro-reducao, multa-real-sem-lucro, multa-demais-requisitos, multa-demais-erro, multa-demais-atraso, multa-demais-reducao, multa-automatica | versão do leiaute |
| `content/regras/obrigatoriedade.json` | 11 | obrigados, dispensa-simples, dispensa-publicos, dispensa-inativas, scp, imunes-isentas, inatividade-anual, simples-saida, simples-entrada, recuperacao-obrigatoria, ordem-recuperacao | versão do leiaute |
| `content/regras/prazos.json` | 4 | prazo-regra-geral, prazo-especial-1, prazo-especial-2, prazo-horario | versão do leiaute |
| `content/regras/retificacao.json` | 8 | retificacao, retificacao-regime, retificacao-parte-b, retificacao-sem-efeito, retificacao-ecd, retificacao-dctf, sped-cruzamento, ecf-anterior-exigida | versão do leiaute |
| `content/regras/tributos.json` | 22 | irpj-aliquota, irpj-adicional, irpj-adicional-limite, irpj-adicional-integral, csll-aliquota, comp-prejuizo, comp-base-negativa, apuracao-trimestral, pres-irpj-geral, pres-irpj-combustiveis, pres-irpj-transporte, pres-irpj-servicos, pres-csll-geral, pres-csll-servicos, presumido-base, presumido-opcao, lucro-real-conceito, provisoes, multas-fiscais, csll-indedutivel, formulas-ecf, lc-224 | versão do leiaute |

Em `blocos.json`, além do schema, faltavam os cinco campos. `fontes.json` não tinha erro de conteúdo: só o schema não estava exportado com um nome próprio.

## Como foi corrigido

| Grupo | Correção | Fonte oficial |
|---|---|---|
| Regras e tributos | Leiautes 11 e 12, pelos anos-calendário 2024 e 2025 que cada regra já trazia | Manual do leiaute 12, tabela "Leiaute, Período e Manual" |
| Linha do tempo | Ano e leiaute de cada marco | Mesma tabela, e as fontes que cada marco já citava |
| IN RFB nº 1.422/2013 | Texto lido: "a partir do ano-calendário de 2014"; revogada pela IN RFB nº 2.004/2021 | https://normasinternet2.receita.fazenda.gov.br/#/consulta/externa/48711 |
| Programa da ECF | Versão 12.2.8 atende aos leiautes 1 a 12 | Comunicado de 19/10/2026 em gov.br/sped |
| Duas regras que citam a tabela dinâmica do leiaute 12 e valem também para 2024 | Tabela do leiaute 11 conferida. A linha da CSLL é igual. Das 62 fórmulas comparadas, 6 têm texto diferente, e o cálculo do simulador não muda para períodos até 31/12/2025; o resumo da regra foi corrigido para dizer isso | Tabelas dinâmicas dos leiautes 11 e 12 |
| Registros, matriz, grafo, legendas, blocos, divergências e tabelas | Bloco `rastreio` por arquivo | Manual de cada leiaute |

Para marcos com norma ainda em vigor (Sped e IN nº 2.004/2021), o ano-calendário informado é o coberto pelo site, e não toda a vigência da norma.

## Continua "a verificar"

| Onde | O que falta |
|---|---|
| `regras/tributos.json`, `arredondamento` | O material oficial lido não define como o programa arredonda. Conferir no programa da ECF |
| `legendas.json`, tipo `D` | O Manual não define este tipo de campo no trecho lido |
| `leiautes/11` e `leiautes/12`, registro W100, campo JURISIDICAO_CONTROLADORA | Três regras sem o tipo (erro, aviso ou habilita) no Manual: REGRA_HABILITA_CONTROLADORA_DIFERENTE, REGRA_JURISDICAO_CONTROLADORA_OBRIGATORIO e REGRA_JURISDICAO_CONTROLADORA_NAO_PREENCHER |
