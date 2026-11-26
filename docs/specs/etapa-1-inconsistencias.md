# Spec: Etapa 1, correção de inconsistências

Status: **aguardando aprovação** · 26/11/2026 · ramo `melhorias-etapa-1`

Origem: `prompt-melhorias-ecf.md`, etapa 1. A skill `spec-funcionalidade` citada no prompt não existe; esta spec segue o mesmo propósito. Ordem combinada: etapa 1, depois os pilotos da simulação (etapa 5), depois as etapas 2, 3, 4, 6 e 7. O site continua fora dos buscadores até a revisão por contador.

## Objetivo

Deixar nomes, contagens, datas, códigos e textos coerentes entre si e com o Manual, sem mudar regra fiscal. Toda correção ganha teste que impede a volta do problema.

## Levantamento (conferido no código, no conteúdo e no site gerado)

| # | Item do prompt | O que encontrei | Situação |
|---|---|---|---|
| 1 | ECD no nome sem conteúdo | Nome “ECF e ECD Descomplicada” no título, no logo e no domínio. Aviso “A parte da ECD ainda não está disponível” no rodapé e na home | Confirmado. **Decisão sua** (abaixo) |
| 2 | Conquista fala em 17 blocos; mapa mostra 13 | O mapa da home filtra pelo regime escolhido (lucro real por padrão: sem P, Q, T e U) e não diz isso | Confirmado |
| 3 | Nomes de blocos divergentes | Três fontes: nome oficial no leiaute, nome curto em `content/blocos.json` e nós externos em `content/grafo.json`. O bloco E tem nome curto “ECF anterior”, igual ao nó externo “ECF anterior” do mesmo mapa. “Saldos da parte B” é o rótulo da ligação E → M, não nome de bloco | Confirmado, com outra causa |
| 4 | Duas datas de verificação na mesma página | Home: 24/11 (leiaute) e 25/11 (comunicado do programa). As duas vêm dos dados, mas a tela não diz a que cada uma se refere | Confirmado em parte |
| 5 | Link da versão 12.2.8 com `copy4_of…12-2-4` | Aberto em 26/11: a página tem o título “Publicação da Versão 12.2.8 do Programa da ECF”. O endereço é estranho porque o gov.br copiou a página da 12.2.4. Mesmo caso na 12.2.2 (`copy4_of…12-1-7`), também conferida | **Não é defeito.** Proponho só registrar a conferência |
| 6 | “M300A” com link para M300 | M300A é a tabela dinâmica usada no registro M300, não um registro. O rótulo da ligação L → M diz “M300A, linha 2” e o link vai para o M300 | Confirmado |
| 7 | Erro de SCP apontando para o 0020 | No Manual 12 e no 11, `REGRA_QTD_SCP` fica no campo `0020.IND_QTE_SCP` (“igual ao número de registros 0035 informados”). O registro está certo; o texto não cita o 0035 | **Não é defeito de registro.** Melhorar o texto |
| 8 | Texto repetido no bloco M | O título já diz “e-Lalur e e-Lacs”, e o objetivo começa com “É o e-Lalur e o e-Lacs”. O nome oficial longo aparece duas vezes na página | Confirmado |
| 9 | “Grupos didáticos” e “Depende” | “Depende” aparece nas etiquetas quando se escolhe um regime. Os grupos (Identificação, Apuração etc.) só aparecem dentro da página do bloco, não nos cards | Confirmado para os grupos |
| 10 | “Para que serve” genérico | Em todos os registros, no nível iniciante, o primeiro parágrafo é o objetivo do bloco (“Este registro faz parte do bloco 0. Diz quem é a empresa…”). O texto do Manual que vem depois é específico | Confirmado: **todos os registros** (180 no leiaute 12, 179 no 11) |
| 11 | Logo lido como “ECDdescomplicada” | Falta espaço entre “ECF e ECD” e o “descomplicada” oculto | Confirmado |
| 12 | “Previsto” e etiquetas de origem sem legenda | Etiquetas Previsto, Depende e Não previsto sem explicação; o mapa da página de blocos usa “ECD” e “ECF ant.” sem legenda | Confirmado |

## Decisões que preciso de você

**D1. ECD no nome.**
- **(a) Selo “ECD em breve”** ao lado do nome, no cabeçalho e no título das páginas. Mantém domínio, repositório e marca. **Recomendo.**
- (b) Tirar a ECD do título até existir conteúdo. O domínio `ecf-ecd-descomplicada.vercel.app` e o repositório continuariam com “ecd”.

**D2. Textos “Para que serve” específicos por registro.** Escrever cerca de 180 textos de uma vez é conteúdo fiscal novo em volume. Proposta:
- agora: trocar o rótulo do parágrafo genérico para “Sobre o bloco 0” (honesto) e manter o texto do Manual como “Para que serve”;
- nos pilotos da simulação (0035, 0000, M300 e um registro de tabela dinâmica): escrever o texto específico de cada um;
- gerar `docs/revisao/para-que-serve.md` com os registros (180 no leiaute 12, 179 no 11) que ainda usam só o texto do Manual, para revisão e redação em lotes.

**D3. Nome curto do bloco E.** Hoje “ECF anterior”, igual ao nó externo. Proposta: **“Dados recuperados”**, a partir do nome oficial (“Informações Recuperadas da ECF Anterior e Cálculo Fiscal dos Dados Recuperados da ECD”).

## O que muda

1. **ECD:** conforme D1. Nos blocos C, E, J e K, etiqueta “dados da ECD” onde o conteúdo vem da ECD, com uma frase dizendo o que é ECD e o que é ECF. A origem vem do campo `origem` já existente, sem regra nova.
2. **Contagem:** acima do mapa, “Mostrando o caminho do Lucro real: 13 de 17 blocos”. Muda com o regime. A conquista continua em 17 e diz “os 17 blocos cobertos, em qualquer regime”.
3. **Fonte única de nomes:** módulo `src/lib/conteudo/blocos.ts` com `nomeBloco(letra, ano)` devolvendo nome oficial (do leiaute do ano), nome curto e descrição (de `content/blocos.json`). Todos os componentes passam a usá-lo. O bloco E ganha o nome curto de D3. Teste: nenhum componente escreve nome de bloco à mão, e o nome curto é único no mapa.
4. **Datas:** cada data diz a que se refere (“leiaute verificado em…”, “comunicado verificado em…”). O selo do topo segue mostrando a verificação mais antiga dos itens da página. Teste: toda data de verificação na tela tem rótulo e vem dos dados.
5. **Link 12.2.8:** sem mudança no endereço. Registro da conferência em `content/fontes.json` (data e título lido), e o monitor passa a conferir que o título da página bate com a versão citada.
6. **Códigos:** o rótulo vira “Tabela dinâmica M300A (registro M300), linha 2”. Teste: todo código de registro citado em texto existe no leiaute do ano; códigos de tabela dinâmica (sufixo A, R etc.) só aparecem com a palavra “tabela”.
7. **SCP:** texto do erro passa a “Informar no 0020 uma quantidade de SCP diferente do número de registros 0035”, citando `REGRA_QTD_SCP`. O registro continua o 0020.
8. **Bloco M:** o título usa o nome oficial uma vez; o objetivo deixa de repetir o nome (“Parte do lucro contábil, soma adições, tira exclusões…”). A lista de registros não repete o nome longo. Teste: nenhuma frase de até 120 caracteres aparece duas vezes na mesma página.
9. **Grupos:** cada card da página de blocos mostra o grupo (ex.: “Apuração”) e há uma legenda dos grupos; a frase sobre “Depende” passa a ficar junto das etiquetas, que só aparecem com um regime escolhido.
10. **Para que serve:** conforme D2.
11. **Logo:** nome acessível “ECF e ECD Descomplicada, página inicial” (ou o nome de D1). Teste com o nome acessível calculado pelo navegador.
12. **Legendas:** legenda visível para Previsto, Depende e Não previsto, e para “ECD” e “ECF ant.” no mapa. As abreviações ganham texto completo para leitor de tela (`<abbr>` com título e texto oculto), sem depender de passar o mouse.

## Fora desta etapa

Perfil, home nova, menu novo e cards com número de registros (etapa 2); qualquer regra ou valor fiscal novo; redação de todos os textos “Para que serve”.

## Testes

- Novos casos: CN-070 (nomes de bloco vêm de uma fonte), CN-071 (códigos citados existem), CN-072 (nada repetido na página), CN-073 (datas rotuladas e vindas dos dados), CT-110 (mapa diz o regime e a contagem), AC-020 (legendas e nome acessível do logo), SM-006 (aviso de ECD conforme D1).
- Bateria completa ao fim: tipos, lint, conteúdo, testes unitários, navegador e axe, com o relatório atualizado.

## Critério de pronto

Os 12 itens tratados como acima, testes novos e antigos aprovados, sem violação de acessibilidade e sem regra fiscal nova. Nada de commit, envio ou publicação sem a sua autorização.
