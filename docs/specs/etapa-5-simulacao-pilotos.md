# Spec: Etapa 5 (adiantada), simulação de preenchimento, pilotos

Status: **aprovada** (1 sim, 2 sim, 3 junto) · 26/11/2026

Origem: `prompt-melhorias-ecf.md`, etapa 5, com os ajustes combinados em 26/11: fazer 4 pilotos, avaliar com você e só depois escalar para todos os registros, em níveis. Sem dependência nova; Remotion e exportação em MP4 ficam para depois.

## Objetivo

Na página do registro, uma simulação curta (30 a 90 s) que parece um vídeo, mas é um componente interativo montado com os dados do site. Ela mostra a decisão de gerar o registro, o preenchimento campo a campo, a validação e a linha final.

## Pilotos, nesta ordem

| Registro | Por que | Empresa | Regras do Manual |
|---|---|---|---|
| **0035** Identificação das SCP | Obrigatoriedade condicional (0000.TIP_ECF = 1) e regra simples de CNPJ | Dados de teste do Manual, adaptados (abaixo) | 2 de campo |
| **0000** Abertura | Muitos campos e a abertura do arquivo | Móveis Aurora (lucro real, já no site) | 24 de campo |
| **M300** Parte A do e-Lalur | Valores, tabela dinâmica e ligação com L300 e M310 | Móveis Aurora | 4 de registro e 9 de campo |
| **L100** Balanço | Formato de tabela dinâmica com saldos | Móveis Aurora | 9 de registro e 4 de campo |

Para o 0035, o Manual traz `|0035|11111111000291|SCP TESTE 1|`, mas o 0000 de teste dele tem TIP_ECF = 0, ou seja, não teria 0035. A simulação usa a mesma “EMPRESA TESTE” com TIP_ECF = 1, avisando que o valor foi trocado para o exemplo fazer sentido. Divergência a registrar em `content/divergencias.json`: na explicação do exemplo, o Manual escreve o CNPJ da SCP com 15 dígitos; na linha, com 14.

## Como funciona na tela

Uma seção nova na página do registro, “Veja o preenchimento”, abaixo do exemplo preenchido. O componente só é baixado quando a pessoa clica em “Iniciar”.

1. **Ficha da empresa:** os fatos que importam para este registro.
2. **Decisão:** a pergunta do Manual (ex.: “A empresa é sócia ostensiva de SCP?”). A pessoa responde. No “não”, a tela mostra que o registro não é gerado e por quê, citando a condição.
3. **Identificação:** realce ligando o fato da ficha ao campo da tabela.
4. **Preenchimento:** digitação animada, campo a campo, montando `|0035|11111111000291|SCP TESTE 1|`.
5. **Validação:** cada regra conferida na tela. Depois, um cenário com erro proposital mostra a mensagem que o programa daria e como corrigir.
6. **Resumo:** linha final, campos, fonte e data de verificação. O selo de incentivo fiscal (etapa 4) entra aqui quando existir.

**Controles:** play e pausa, passo anterior e próximo, velocidade 0,5x, 1x e 1,5x, reiniciar e barra de progresso clicável. Legenda sempre visível, no nível escolhido. Teclado: Espaço, ← e →, só com o foco dentro do player, para não roubar a rolagem da página. `aria-live` para os passos e foco visível. Com movimento reduzido, a simulação vira uma lista de passos, sem animação. Sem rolagem lateral em 375 px.

## Dados

`content/roteiros/<bloco>/<registro>.json`, validado por Zod, com rastreio completo (fonte, norma, leiaute, ano-calendário, data de verificação e status). Só a parte que não sai dos dados fica no arquivo:

- empresa (exemplo do Manual ou empresa fictícia do site) e os fatos mostrados;
- cenários `normal`, `dispensado` e `erro`, cada um dizendo a regra que demonstra;
- passos `fato | decisao | campo | validacao | resultado`, com campo, valor, origem do valor e legenda nos dois níveis.

Tipo, tamanho, decimais, valores válidos e obrigatoriedade vêm do leiaute. **A linha `|REG|…|` é gerada por código**, nunca escrita à mão. Os valores dos registros de Móveis Aurora vêm do mesmo gerador que já produz o exemplo da página.

## Regras de validação em código

- **Genéricas, para todo registro:** tipo, tamanho, decimais, valores válidos e obrigatoriedade, a partir do leiaute.
- **Específicas, só as dos pilotos:** cada regra vira uma função em `src/lib/validacao/regras/`, com o texto do Manual ao lado e testes com casos feitos à mão (passa, falha e limite).
- **Regras que comparam com outros registros** (ex.: L100 com E010 e K155) entram na simulação só quando o cenário tem os dois lados. Quando não tem, a tela diz “conferida pelo programa com o registro X; não simulada aqui”, sem fingir.
- Nenhuma regra é inventada: o texto vem do Manual do leiaute, e o status fica em “conferido”. Só o contador leva a “revisado”.

## Textos “Para que serve” próprios

Os 4 pilotos ganham o texto didático próprio (decisão D2 da etapa 1), com o trecho do Manual citado.

## Agentes, skill e hooks

Os agentes citados no prompt ainda não existem; esta etapa os cria, em `.claude/`:

- **Skill `roteiro-preenchimento`:** passo a passo para escrever um roteiro, do registro do Manual ao teste.
- **Agente `roteirista-fiscal`:** escreve roteiros a partir do Manual e dos dados do site. Instruído a escrever só em `content/roteiros/`; o hook confere o caminho.
- **Agente `revisor-fiscal`:** confere cada roteiro contra o Manual, sem ter escrito o roteiro, e aponta divergências.
- **Agente `qa-tester`:** roda e amplia os testes do componente.
- **Hook PostToolUse** (ampliação do hook de conteúdo) para `content/roteiros/**`: schema; valores respeitando tipo, tamanho, decimais e valores válidos; cenário normal passando nas regras; cenário de erro falhando exatamente na regra que diz demonstrar; linha com o número certo de campos. Falhou: código 2 com explicação.
- **Hook PreToolUse:** instalar dependência nova pede a sua aprovação. Remotion não entra.

Um agente revisando outro não substitui o contador: o status máximo continua “conferido”.

## Testes

- **CN:** os quatro roteiros validados, linha gerada igual ao exemplo do Manual (0035) e ao gerador do site (os outros três), cenário de erro falhando na regra certa, regras com casos à mão.
- **CT:** decisão sim e não, play, pausa, passos, velocidade, reiniciar, barra de progresso, duplo clique e F5.
- **AC:** axe nos dois temas e por teclado; legenda e `aria-live`; movimento reduzido vira lista.
- **RS:** 375, 768, 1050 e 1440 px, sem rolagem lateral.
- **RD:** nada baixado antes do clique; o roteiro vem de um arquivo estático por registro.
- **SG:** nenhum HTML montado à mão; dados só dos arquivos do site.

## Avaliação dos pilotos

Ao fim, paro e mostro a prévia. Para decidir a escala, medimos:

- duração real de cada simulação;
- quanto de cada roteiro saiu automático e quanto foi escrito à mão;
- tempo para escrever e testar um roteiro completo;
- o que você achar do ritmo, das legendas e do tamanho na tela.

Com isso escrevo a spec da escala: nível **básico** gerado para os 178 registros com exemplo, **completo** em lotes por bloco e **só texto** para Y750 e 9100.

## Fora desta etapa

Exportar vídeo; os outros registros; incentivos fiscais (etapa 4); qualquer regra fiscal nova além do texto do Manual.

## Decisões que preciso de você

1. **0035 com a EMPRESA TESTE do Manual e TIP_ECF trocado para 1**, com aviso na tela. Recomendo.
2. **Onde fica:** seção “Veja o preenchimento” abaixo do exemplo, carregada só no clique. Recomendo.
3. **Publicar a etapa 1 antes** ou junto com os pilotos.

## Critério de pronto

Os 4 pilotos funcionando nos dois níveis, nos dois temas e com movimento reduzido. Testes novos e antigos aprovados e prévia mostrada para a sua avaliação, sem commit, envio ou publicação sem autorização.
