# Spec: Etapa 4, incentivos fiscais e a LC nº 224/2025

Status: **aprovada** · 26/11/2026 (sim nas 3 decisões: LC 239 com datas "a verificar"; fichas "a verificar" publicadas com selo; simulador só AC 2026)

Origem: `prompt-melhorias-ecf.md`, etapa 4.
Pesquisa feita em 26/11/2026, só em fontes oficiais. Os textos dos sites do Planalto e do portal de normas da Receita valem como fonte, mas não substituem o DOU; o in.gov.br recusa leitura automática, e eu não contornei isso.

## 1. O que a pesquisa encontrou

### Fontes lidas

| Fonte | Endereço | O que traz |
|---|---|---|
| LC nº 224, de 26/12/2025 (texto compilado) | planalto.gov.br/ccivil_03/leis/lcp/lcp224.htm | art. 4º (redução), § 5º (lucro presumido), § 8º (exceções), art. 7º (CSLL), art. 8º (JCP), art. 14 (efeitos) |
| LC nº 239, de 24/11/2026 | planalto.gov.br/ccivil_03/leis/lcp/lcp239.htm | reescreve o art. 4º da LC 224: **10% passa a 20%**; art. 15 (efeitos) |
| LC nº 235, de 27/08/2026 | planalto.gov.br/ccivil_03/leis/lcp/lcp235.htm | nova redação da exceção das entidades sem fins lucrativos (§ 8º, V) |
| IN RFB nº 2.305, de 31/12/2025, multivigente | normasinternet2.receita.fazenda.gov.br, consulta 148694 | arts. 2º e 3º (alcance e datas), 14 e 15 (lucro presumido), 16 (exceções), Anexo Único (34 itens preservados) |
| IN RFB nº 2.306, de 22/01/2026, e nº 2.307, de 20/02/2026 | as mesmas (alterações) | regras do limite trimestral e do ajuste do 4º trimestre; Anexo Único novo |
| Perguntas e Respostas RFB, versão 5, de 30/07/2026 | gov.br/receitafederal (PDF) | perguntas 6, 11 a 14 (lucro presumido, com exemplos), 21, 21.1 e 36 (PAT, esporte, Rouanet), 37 (benefícios criados depois) |
| Manual da ECF, leiaute 12 (versão usada no site) | gov.br/sped | item 1.32 e Bloco P, item XII: a LC 224 na ECF; campo 0020.IND_ALIQ_CSLL com as alíquotas transitórias |
| Notícias do STF | noticias.stf.jus.br | ADI 7936 (CNS) e ADI 7982 (CNC) contra o acréscimo do lucro presumido; ADI 7920 (CNI) sobre benefícios com condição onerosa |

### Achado principal: a LC 239, publicada há dois dias, dobra a redução

- **Na LC 224 original,** a redução é de 10% e vale para o AC 2026:
  - IRPJ a partir de 1º/01/2026;
  - CSLL e demais tributos a partir de 1º/04/2026.
  - No lucro presumido, isso dá IRPJ desde o 1º trimestre e CSLL desde o 2º trimestre. As perguntas 6 e 12 da Receita confirmam.
- **A LC 239 (24/11/2026) passa a redução para 20%:**
  - acréscimo de 20% nos percentuais de presunção;
  - 80% do benefício nas deduções e reduções.
- **Efeitos da LC 239 (art. 15):**
  - 1º/01/2027 para os tributos "não sujeitos à noventena";
  - o 1º dia do 4º mês depois da publicação (1º/03/2027) para os que estão sujeitos a ela.
  - Separar IRPJ e CSLL entre essas duas datas é **minha leitura** da Constituição, por isso fica marcado **"a verificar"** até haver texto da Receita.
- **A Receita ainda não publicou nada sobre a LC 239.** O Perguntas e Respostas v5 é de julho, e o Manual da ECF fala em 10%.

**Proposta:** o site mostra as duas camadas, cada uma com o seu ano-calendário:
- **AC 2026, 10%:** conferido nas fontes.
- **AC 2027 em diante, 20%:**
  - o percentual sai do texto da lei e fica "conferido";
  - as datas de início por tributo ficam "a verificar".

### Situação de cada incentivo de IRPJ/CSLL do escopo

| Incentivo | Situação na LC 224 | Base da classificação |
|---|---|---|
| Lucro presumido (acréscimo na presunção) | **Alcançado** | LC 224, art. 4º, § 2º, II, a, e § 5º; IN 2.305, arts. 14 e 15; P&R 11 a 14 |
| PAT, dedução do IRPJ devido | **Reduzido** | P&R 21 (DGT); LC 224, art. 4º, § 4º, V |
| Incentivo ao esporte | **Reduzido** | P&R 21 e 36 |
| Lei Rouanet (cultura), dedução do IRPJ | **Reduzido** | P&R 21.1 |
| Doações a entidades civis sem fins lucrativos (despesa dedutível) | **Reduzido** | o item 26 do Anexo Único foi revogado pela IN 2.307 |
| Lei do Bem (inovação tecnológica, arts. 19, 19-A e 26 da Lei 11.196) | **Excetuado** | Anexo Único, item 30 |
| Informática e automação (crédito financeiro de IRPJ e CSLL) | **Excetuado** | Anexo Único, itens 28 e 29; LC 224, § 8º, XIII |
| PADIS (redução de IR sobre o lucro da exploração e créditos) | **Excetuado** | Anexo Único, itens 10 a 13 |
| TI e TIC, capacitação (exclusão do lucro real) | **Excetuado** | Anexo Único, item 31 |
| Entidades sem fins lucrativos, associações civis (isenção de IRPJ e CSLL) | **Excetuado** | Anexo Único, item 34; LC 235 (§ 8º, V) |
| Assistência médica a empregados; previdência privada fechada | **Não é benefício** | Anexo Único, itens 32 e 33; P&R 18 e 19 |
| SUDAM/SUDENE, redução de 75% e reinvestimento | **A verificar** | não está no Anexo; pode cair na exceção de projeto aprovado até 31/12/2025 (§ 8º, IV, P&R 22), caso a caso |
| Audiovisual, Fundos da Criança e do Idoso, PRONON/PRONAS | **A verificar** | não estão no Anexo; falta conferir no DGT da LOA 2026 se constam |

### Outras mudanças da lei (seção separada, não são incentivos)

- **CSLL de setores financeiros** (LC 224, art. 7º): alíquotas transitórias de 12% e 17,5% até 2027. Na ECF, o campo **0020.IND_ALIQ_CSLL** ganhou as opções 7 e 8.
  - O Manual traz uma divergência: a lista de valores válidos continua "[1;3;4]". Ela entra em `divergencias.json`.
- **IRRF sobre JCP:** passa a 17,5% (LC 224, art. 8º).
- **Teto de 2% do PIB** para benefícios, regras da LRF e outros temas: só um resumo, sem ficha.

### Situação judicial

- **ADIs contra o acréscimo do lucro presumido:** 7936 (CNS) e 7982 (CNC), as duas com o ministro Fux.
- **ADI 7920 (CNI):** trata dos benefícios com condição onerosa.
- **O que o site diz:** "ações em andamento no STF; sem decisão localizada em 26/11/2026", com link para cada notícia e sem opinião.
- **Na implementação,** confiro as datas das notícias e a página de cada processo.

## 2. O que entra no site

### Dados

- **Fichas** em `content/incentivos/<slug>.json`, uma por incentivo da tabela, 13 no total. Um schema Zod exige:
  - nome, textos iniciante e profissional, base legal com URL de domínio permitido;
  - tributos, regimes e forma de fruição;
  - **situação na LC 224 por ano-calendário** (AC 2026: 10%; AC 2027: 20% ou "a verificar"), com fonte e dispositivo;
  - registros da ECF (o build confere se existem), situação judicial, data de verificação e status.
- **Regras do lucro presumido** em `content/regras/lc224.json`:
  - limite anual, limite trimestral e acréscimo por AC;
  - início da CSLL no 2º trimestre de 2026.
- **Fichas "a verificar":** saem com o selo "a verificar" e o que falta conferir. Nada é inventado.

### Páginas

1. **Menu:** item "Incentivos fiscais", no grupo INCENTIVOS da coluna lateral.
2. **`/incentivos` (hub):**
   - aviso "LC nº 224/2025: o que muda a partir do AC 2026", com a LC 239 logo abaixo;
   - filtros: tributo, regime e situação na LC 224;
   - cartões com selo de situação ("Reduzido", "Excetuado", "Não é benefício", "A verificar"), sempre com texto, e não só cor.
3. **`/incentivos/<slug>`:**
   - o que é, quem pode usar e como funciona;
   - o que muda com a LC 224, ano a ano;
   - onde preencher na ECF, com links para os registros;
   - fontes;
   - exemplo antes × depois calculado à mão, nos que têm conta: lucro presumido, PAT e Rouanet, a partir dos exemplos oficiais da Receita.
4. **`/novidades/lc-224-2025`:**
   - resumo em linguagem simples;
   - linha do tempo: publicação, Decreto 12.808, IN 2.305, 2.306 e 2.307, as 5 versões do Perguntas e Respostas, LC 235, LC 239 e as ADIs;
   - o que muda na ECF por ano-calendário.
5. **Registros ligados:** selo "Incentivos neste registro" nos registros e blocos citados nas fichas, como P200, P300, P400, P500, N620, N630 e 0020. A lista final sai da conferência dos códigos.
6. **Simulador:**
   - nova opção de regras "AC 2026 (LC 224)" para o lucro presumido: acréscimo de 10% sobre o que passar de R$ 1.250.000 no trimestre, IRPJ desde o 1º trimestre e CSLL desde o 2º, com o passo a passo;
   - o AC 2025 continua como hoje;
   - o AC 2027 (20%) **não** é simulado enquanto as datas por tributo estiverem "a verificar"; aparece só um aviso;
   - os testes usam os números dos exemplos oficiais (P&R 11 e 14; Manual, Bloco P, XII).
   - **Fora do simulador:** o ajuste do 4º trimestre (IN 2.305, art. 15, § 5º) tem várias hipóteses. Ele fica explicado na ficha, mas não é simulado.
7. **Perfil:** quem tem regime "lucro presumido" vê na home um aviso curto sobre o acréscimo, com link para a ficha.
8. **Glossário:** DGT, benefício tributário, redução linear, sistema padrão de tributação, lucro da exploração e fruição, cada termo com fonte.
9. **Monitor:** passa a vigiar as páginas do Perguntas e Respostas e da LC 224, que são as fontes por GET. A IN 2.305 só abre no navegador, então fica como lembrete manual, como já acontece com a IN 2.004.

### Seletor de ano

- **Continua com 2024 e 2025.** Não existe leiaute 13, e oferecer o AC 2026 no seletor seria prometer um conteúdo de ECF que ainda não existe.
- **Ano dentro das páginas de incentivos:** cada informação diz a partir de qual AC vale, e a página de incentivos não depende do ano da URL.

### Agentes, skill e hook (pedidos pelo prompt)

- **`.claude/agents/pesquisador-legislacao.md`:** busca restrita à lista de domínios oficiais; escreve só em `content/incentivos/`.
- **`.claude/skills/ficha-incentivo/SKILL.md`:** o passo a passo para montar uma ficha.
- **Hook de conteúdo:** passa a conferir `content/incentivos/**`, exigindo URL da lista, situação com dispositivo, vigência por AC, data de verificação e registros existentes.
- **Revisão:** o `revisor-fiscal` revisa as fichas contra as fontes, sem ter participado da pesquisa.

## Testes

- **CT:**
  - filtros do hub;
  - ficha com selo e links para registros;
  - simulador AC 2026 com os números dos exemplos oficiais (8% sobre R$ 1.250.000 mais 8,8% sobre R$ 250.000; atividades mistas: R$ 1.000.000 × 8% + R$ 440.000 × 8,8% + R$ 250.000 × 32% + R$ 110.000 × 35,2%);
  - CSLL sem acréscimo no 1º trimestre de 2026;
  - aviso no perfil do lucro presumido;
  - selo nos registros.
- **CN:**
  - toda ficha com fonte da lista de domínios e registros existentes;
  - nenhum percentual escrito em componente;
  - a LC 239 marcada com a data de verificação.
- **AC e RS:** hub e ficha nos dois temas e nas 4 larguras; selo com texto.
- **SG:** URL das fichas só da lista de domínios; filtros do hub só aceitam valores da lista.

## Decisões para você

1. **LC 239 (20% a partir de 2027):** mostrar já, com as datas "a verificar", como proposto? Ou esperar a Receita se manifestar e, por enquanto, mostrar só um aviso?
2. **Incentivos "a verificar"** (SUDAM/SUDENE, audiovisual, fundos, PRONON/PRONAS): publicar a ficha com o selo e o que falta, ou deixar fora até conferir no DGT?
3. **Simulador:** só o AC 2026, deixando o ajuste do 4º trimestre explicado na ficha e sem simular, como proposto?

**Minha recomendação:** sim nas três. A LC 239 entra com o selo, porque omitir uma lei publicada seria pior; as fichas "a verificar" entram com o selo, porque o selo existe para isso; o simulador fica só no caso que tem exemplo oficial para testar.

## Fora do escopo

- AC 2026 no seletor de ano e leiaute 13.
- Incentivos de PIS/Cofins, IPI e II: o site é de ECF.
- Opinião sobre as ADIs.
- Bloco S.
