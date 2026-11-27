# Spec: Etapa 5, escala da simulação de preenchimento

Status: **aprovada** · 26/11/2026

Origem: avaliação dos pilotos (0035, 0000, M300 e L100) e decisão de 26/11 sobre o formato: **linha explicada** como padrão em todos os registros; **"Ver animado"** só nos registros com roteiro completo; **só texto** para Y750 e 9100.

## Onde estamos

| Nível | Situação |
|---|---|
| Básico (linha explicada) | **Pronto e publicado**: 178 de 180 registros no AC 2025 e 177 de 179 no AC 2024. Sai dos dados do site, sem trabalho manual |
| Só texto | Pronto: Y750 e 9100 explicam por que não há exemplo |
| Completo (animado) | 4 pilotos publicados |

Ou seja, a escala que falta é só a do **completo**.

## Quais registros merecem a versão animada

A animação vale a pena quando há uma história: uma decisão (o registro existe?), regras do Manual para conferir e um erro que vale mostrar. Levantamento no leiaute 12:

| Bloco | Registros | Com regras do Manual | Com dados da empresa fictícia |
|---|---|---|---|
| 0 | 9 | 7 | 7 (Aurora) |
| J | 6 | 5 | 4 (Aurora) |
| K | 9 | 8 | 7 (Aurora) |
| L | 7 | 5 | 5 (Aurora) |
| M | 18 | 12 | 12 (Aurora) |
| N | 13 | 12 | 7 (Aurora) |
| P, Q | 14 | 12 | 10 (Café do Vale) |
| Y | 20 | 19 | 6 (Aurora, Girassol) |
| X | 33 | 22 | 3 |
| T, U, V, W | 26 | 20 | 0 |
| C, E | 20 | 6 | 0 (dados recuperados da ECD) |
| 9 | 5 | 1 | 0 |

**Critério:** entra no completo o registro que tem regra do Manual **e** dados de uma empresa fictícia do site (ou exemplo do Manual que faça sentido). São cerca de **60 registros**. Os outros ficam no básico, que já explica cada campo.

## Lotes

| Lote | Registros | Por quê |
|---|---|---|
| 1 | Bloco 0 restante (0010, 0020, 0030, 0930…) | Abertura do arquivo; todo mundo passa por aqui |
| 2 | J e K | Plano de contas e saldos, a base do L e do M |
| 3 | L e M restantes | Balanço, DRE e e-Lalur, o coração do lucro real |
| 4 | N | Cálculo do IRPJ e da CSLL |
| 5 | P e Q | Lucro presumido (Café do Vale); entra depois da etapa 4, que muda a presunção a partir do AC 2026 |
| 6 | Y | Informações gerais |

**Fora da escala por enquanto:**
- **X, T, U, V e W:** as empresas do site não usam esses blocos, e criar dados fictícios novos para eles é um trabalho à parte. Ficam no básico. Se você quiser, viram um lote 7, com empresas novas.
- **C e E:** são dados recuperados da ECD, sem exemplo do Manual. Ficam no básico.

## Como cada lote é feito

1. **Escrita:** `roteirista-fiscal` escreve os roteiros (skill `roteiro-preenchimento`).
2. **Regras novas em código:** cada uma em `src/lib/simulacao/regras.ts`, com o texto do Manual ao lado e testes com casos feitos à mão.
3. **Revisão:** `revisor-fiscal` revisa sem ter escrito. Divergências do Manual vão para `content/divergencias.json`.
4. **Testes:** `qa-tester` amplia os testes. Bateria completa no fim de cada lote.
5. **Avaliação e publicação:** paro para você avaliar. A publicação segue o fluxo de sempre (5 passos, com a sua autorização), lote a lote ou juntando lotes, como preferir.

**Regras que dependem de outro registro:** aparecem como "não simulada", com o motivo, até o cenário ter os dois lados.

## Ajustes que entram junto

- **Texto das regras na linha explicada:** hoje o painel do campo mostra só o código da regra. Passa a mostrar também o texto do Manual, recolhido.
- **Selo de incentivo fiscal no resumo** da animação (pedido da etapa 5): entra quando a etapa 4 existir.
- **Tempo:** cada roteiro fica entre 30 e 90 s a 1x. Registro com muitos campos vazios pula os vazios em bloco, para não arrastar.

## Ordem em relação às outras etapas

Recomendo fazer os lotes 1 a 4 **depois da etapa 3** (navegação), porque ela cria âncoras de campo e o anterior/próximo que a simulação aproveita. O lote 5 vem **depois da etapa 4** (incentivos e LC 224). O lote 6 entra antes da etapa 7, que revisa tudo.

## Medidas de acompanhamento

Por lote: duração de cada simulação, regras simuladas e não simuladas, divergências achadas e tempo gasto. Os números vão para o relatório de testes.

## Fora desta spec

Exportar vídeo (Remotion/MP4); empresas fictícias novas para X, T, U, V e W; o "Tente você" (a pessoa preenche e o site confere), que fica para uma etapa própria nos registros centrais.

## Decisões que preciso de você

1. **Critério e lotes** como acima, cerca de 60 registros. Recomendo.
2. **X, T, U, V e W fora por agora**, no básico. Recomendo.
3. **Ordem:** lotes 1 a 4 depois da etapa 3, lote 5 depois da etapa 4. Recomendo.
4. **Publicação:** a cada lote ou juntando vários?
