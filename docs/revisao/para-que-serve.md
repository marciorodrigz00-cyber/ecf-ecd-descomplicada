# Revisão: textos “Para que serve” por registro

Gerado em 26/11/2026 a partir de `content/leiautes/`. Etapa 1, decisão D2 da spec `docs/specs/etapa-1-inconsistencias.md`.

Hoje nenhum registro tem texto didático próprio. A página de cada um mostra o texto do Manual em “Para que serve” e, no nível iniciante, o objetivo do bloco em “Sobre o bloco”. Esta lista serve para escrever os textos próprios em lotes. Cada texto novo é conteúdo fiscal: precisa citar o trecho do Manual e passar pela revisão do contador.

Primeiros a escrever: 0035, 0000, M300 e um registro de tabela dinâmica (pilotos da simulação de preenchimento).

- Leiaute 12: 180 registros; 36 sem descrição no Manual (0001, 0990, C001, C990, E001, E990, J001, J990, K001, K990, L001, L990, M001, M990, N001, N990, P001, P990, Q001, Q990, T001, T990, U001, U990, V001, V990, W001, W990, X001, X365, X366, X370, X375, X485, X990, Y001).
- Leiaute 11: 179 registros; 0 existem só nele.

## Leiaute 12

| Registro | Nome | Também no 11 | Texto do Manual (início) |
|---|---|---|---|
| 0000 | Abertura do Arquivo Digital e Identificação da Pessoa Jurídica | sim | Este registro identifica unicamente uma escrituração no PGE por meio dos seguintes campos: - 0000.CNPJ – Campo CNPJ (CNPJ BÁSICO – 8… |
| 0001 | Abertura do Bloco 0 | sim | **sem descrição no Manual** |
| 0010 | Parâmetros de Tributação | sim | Apresenta os parâmetros fiscais que identificam quais blocos e registros serão preenchidos. O plano de contas referencial a ser… |
| 0020 | Parâmetros Complementares | sim | Apresenta os parâmetros que identificam quais blocos e registros a serem preenchidos. |
| 0021 | Parâmetros de Identificação dos Tipos de Programa | sim | Identifica se a pessoa jurídica é: a) habilitada ao Regime Especial de Tributação para a Plataforma de Exportação de Serviços de… |
| 0030 | Dados Cadastrais | sim | Apresenta os dados cadastrais da pessoa jurídica. |
| 0035 | Identificação das SCP | sim | O registro só deve ser utilizado nas ECF das pessoas jurídicas sócias ostensivas que possuem Sociedades em Conta de Participação (SCP),… |
| 0930 | Identificação dos Signatários da ECF | sim | Informa os dados dos signatários da escrituração. São obrigatórias duas assinaturas: uma do contabilista e uma da pessoa jurídica,… |
| 0990 | Encerramento do Bloco 0 | sim | **sem descrição no Manual** |
| 9001 | Abertura do Bloco 9 | sim | Este registro indica se o Bloco 9 possui dados informados. |
| 9100 | Avisos da Escrituração | sim | Registro inserido pelo sistema com as divergências apontadas pelas regras que geram advertências. |
| 9900 | Registros do Arquivo | sim | Este registro informa a quantidade total de registros por tipo de registro do arquivo da ECF. Devem ser mostradas a quantidade de… |
| 9990 | Encerramento do Bloco 9 | sim | Este registro informa a quantidade total de registros do Bloco 9. Há que se ressaltar que vários registros ocorrem mais de uma vez.… |
| 9999 | Encerramento do Arquivo Digital | sim | Este registro informa a quantidade total de registros (linhas) do arquivo da ECF. Há que se ressaltar que vários registros ocorrem mais… |
| C001 | Abertura do Bloco C | sim | **sem descrição no Manual** |
| C040 | Identificador da ECD | sim | Identifica as ECD recuperadas pelo sistema. O registro é preenchido pelo sistema ao executar a funcionalidade de recuperação de ECD. |
| C050 | Plano de Contas da ECD | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera os registros I050 (plano de contas… |
| C051 | Plano de Contas Referencial | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera os registros I051 (centro de custo e… |
| C053 | Subcontas Correlatas | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera os registros I053 (subcontas correlatas)… |
| C100 | Centro de Custos | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera os registros I100 (centro de custo) das… |
| C150 | Identificação do Período dos Saldos Periódicos das Contas | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera as contas dos registros I150 (saldos… |
| C155 | Detalhes dos Saldos Contábeis das Contas | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera as contas dos registros I155 (detalhes dos… |
| C157 | Transferência de Saldos do Plano de Contas Anterior | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera o registro I157 (transferência de saldos… |
| C350 | Identificação da Data dos Saldos das Contas de Resultado Antes do Encerramento | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera as contas patrimoniais dos registros I350… |
| C355 | Detalhes dos Saldos das Contas de Resultado Antes do Encerramento | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperação da ECD. Recupera os registros I355 (detalhes dos saldos das… |
| C990 | Encerramento do Bloco C | sim | **sem descrição no Manual** |
| E001 | Abertura do Bloco E | sim | **sem descrição no Manual** |
| E010 | Saldos Finais Recuperados da ECF Anterior | sim | Este registro armazena as informações provenientes dos registros L100/L300 ou P100/P150 ou U100/U150 da ECF do período imediatamente… |
| E015 | Contas Contábeis Mapeadas | sim | Este registro armazena as informações provenientes dos registros K155/K156 da ECF do período imediatamente anterior. O usuário… |
| E020 | Saldos Finais das Contas na Parte B do e-Lalur da ECF Imediatamente Anterior | sim | Recuperação dos saldos finais das contas da parte B do e-LALUR que serão replicados automaticamente pelo sistema para o registro M010/M500. |
| E030 | Identificação do Período | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperar ECD. Calculado de acordo com os períodos fiscais determinados… |
| E155 | Detalhes dos Saldos Contábeis Calculados com Base nas ECD | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperar ECD. Calculado a partir dos registros recuperados C155 de… |
| E355 | Detalhes dos Saldos das Contas de Resultado Antes do Encerramento | sim | Registro preenchido pelo sistema ao executar a funcionalidade de recuperar ECD. Calculado a partir dos registros recuperados C355 de… |
| E990 | Encerramento do Bloco E | sim | **sem descrição no Manual** |
| J001 | Abertura do Bloco J | sim | **sem descrição no Manual** |
| J050 | Plano de Contas do Contribuinte | sim | Registro onde deve ser informado o plano de contas da empresa. |
| J051 | Plano de Contas Referencial | sim | Registro destinado a informar o plano de contas referencial da instituição gestora, referenciando com as respectivas contas do plano de… |
| J053 | Subcontas Correlatas | sim | Registro utilizado para demonstrar os grupos (J053.COD_IDT) compostos de uma conta “pai” e uma ou mais subcontas correlatas. É possível… |
| J100 | Centro de Custos | sim | Registro destinado à informação dos centros de custos utilizados pela pessoa jurídica. |
| J990 | Encerramento do Bloco J | sim | **sem descrição no Manual** |
| K001 | Abertura do Bloco K | sim | **sem descrição no Manual** |
| K030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL no Ano-Calendário | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| K155 | Detalhes dos Saldos Contábeis (Depois do Encerramento do Resultado do Período) | sim | Registro onde devem ser informados os saldos iniciais, os saldos finais, os totais de débitos e os totais de créditos de todas as contas… |
| K156 | Mapeamento Referencial do Saldo | sim | Registro utilizado para mapeamento, por conta referencial, dos saldos de todas as contas patrimoniais da escrituração societária da… |
| K355 | Saldos Finais das Contas Contábeis de Resultado Antes do Encerramento | sim | Registro onde devem ser informados os saldos finais de todas as contas de resultado da escrituração societária da pessoa jurídica antes… |
| K356 | Mapeamento Referencial dos Saldos Finais das Contas Contábeis de Resultado Antes do Encerramento | sim | Registro onde devem ser mapeados, por conta referencial, os saldo finais de todas as contas de resultado da escrituração societária da… |
| K915 | Justificativa para Divergência de Saldos Contábeis das Contas Patrimoniais Recuperados da ECD | sim | Registro onde deve ser apresentada a justificativa do erro ocorrido no K155 (contas patrimoniais), quando do descumprimento as suas… |
| K935 | Justificativa para Divergência de Saldos Contábeis das Contas de Resultado Recuperados da ECD | sim | Registro onde deve ser apresentada a justificativa do erro ocorrido no K355 (contas de resultado), quando do descumprimento as suas… |
| K990 | Encerramento do Bloco K | sim | **sem descrição no Manual** |
| L001 | Abertura do Bloco L | sim | **sem descrição no Manual** |
| L030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL no Ano-Calendário | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| L100 | Balanço Patrimonial | sim | Apresenta o balanço patrimonial com base nas contas referenciais para o período de apuração. O saldo inicial pode ser replicado do… |
| L200 | Método de Avaliação do Estoque Final | sim | Apresenta o método de avaliação de estoques |
| L210 | Informativo da Composição de Custos | sim | Apresenta a composição dos custos dos produtos fabricação própria vendidos e custos dos serviços prestados no período para as empresas… |
| L300 | Demonstração do Resultado Líquido no Período Fiscal | sim | Apresenta o demonstrativo do resultado do exercício para o período de apuração. Os saldos finais do registro L300 não são editáveis.… |
| L990 | Encerramento do Bloco L | sim | **sem descrição no Manual** |
| M001 | Abertura do Bloco M | sim | **sem descrição no Manual** |
| M010 | Identificação da Conta na Parte B do e-Lalur e do e-Lacs | sim | Cadastra os saldos iniciais no período da escrituração das contas da parte B utilizadas no e-LALUR e no e-LACS. O registro pode ser… |
| M030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL das Empresas Tributadas pelo Lucro Real | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| M300 | Demonstração do Lucro Real – Lançamentos da Parte A do e-Lalur | sim | Apresenta os lançamentos da parte A do e-LALUR. Este registro demonstrará a apuração da base de cálculo da IRPJ anual, trimestral e nos… |
| M305 | Conta da Parte B do e-Lalur | sim | Relacionamento do lançamento da parte A do e-Lalur com a conta da parte B do e-Lalur, de acordo com as regras abaixo: - Se adição,… |
| M310 | Contas Contábeis Relacionadas ao Lançamento da Parte A do e-Lalur | sim | Relaciona os lançamentos da parte A do e-Lalur com as contas contábeis. |
| M312 | Números dos Lançamentos Relacionados à Conta Contábil | sim | Esse registro é de preenchimento facultativo para PJ Componente do Sistema Financeiro (0010.COD_QUALIF_PJ = “02”) ou Sociedades… |
| M315 | Identificação de Processos Judiciais e Administrativos Referentes ao Lançamento | sim | Identifica os processos judiciais ou administrativos utilizados que embasaram adições menores que as previstas na legislação ou falta de… |
| M350 | Demonstração da Base de Cálculo da CSLL – Lançamentos da Parte A do e-Lacs | sim | Apresenta os lançamentos da parte A do e-Lacs. Este registro demonstrará a apuração da base de cálculo da CSLL anual, trimestral e nos… |
| M355 | Conta da Parte B do e-Lacs | sim | Relacionamento do lançamento da parte A do e-Lacs com a conta da parte B do e-Lacs, de acordo com as regras abaixo: - Se adição, debita… |
| M360 | Contas Contábeis Relacionadas ao Lançamento da Parte A do e-Lacs | sim | Relaciona os lançamentos da parte A do e-Lacs com as contas contábeis. |
| M362 | Números dos Lançamentos Relacionados à Conta Contábil | sim | Esse registro é de preenchimento facultativo para PJ Componente do Sistema Financeiro (0010.COD_QUALIF_PJ = “02”) ou Sociedades… |
| M365 | Identificação de Processos Judiciais e Administrativos Referentes ao Lançamento | sim | Identifica os processos judiciais e administrativos utilizados que embasaram adições menores que as previstas na legislação ou falta de… |
| M410 | Lançamento na Conta da Parte B do e-Lalur e do e-Lacs sem Reflexo na Parte A | sim | Apresenta os lançamentos em contas da parte B sem reflexos na parte A. |
| M415 | Identificação de Processos Judiciais e Administrativos Referentes ao Lançamento | sim | Identifica os processos judiciais e administrativos utilizados que embasaram adições menores que as previstas na legislação ou falta de… |
| M500 | Controle de Saldos das Contas da Parte B do e-Lalur e do e-Lacs | sim | Apresenta a visão sintética do controle de saldos das contas da parte B do e-LALUR e e-LACS. Registro gerado pelo sistema a partir do… |
| M510 | Controle de Saldos das Contas Padrão da Parte B do e-Lalur e do e-Lacs | sim | Apresenta a visão sintética do controle de saldos das contas padrão da parte B do e-LALUR e e-LACS. Registro gerado pelo sistema a… |
| M990 | Encerramento do Bloco M | sim | **sem descrição no Manual** |
| N001 | Abertura do Bloco N | sim | **sem descrição no Manual** |
| N030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL das Empresas Tributadas pelo Lucro Real | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| N500 | Base de Cálculo do IRPJ Sobre o Lucro Real Após as Compensações de Prejuízos | sim | Apresenta a base de cálculo do IRPJ após as compensações de prejuízos. |
| N600 | Demonstração do Lucro da Exploração | sim | Devem preencher este registro as pessoas jurídicas submetidas à apuração trimestral ou anual do imposto sobre a renda com base no lucro… |
| N605 | Contas Contábeis Utilizadas na Apuração do Lucro da Exploração | sim | Caso a linha N600(48.05) - Tipo de Apuração do Lucro da Exploração seja igual a 2 (Contabilidade), as contas contábeis que formaram o… |
| N610 | Cálculo da Isenção e Redução do Imposto Sobre o Lucro Real | sim | Este registro deve ser preenchido pelas pessoas jurídicas sujeitas à apuração do imposto de renda trimestral ou anual, que gozem dos… |
| N615 | Informações da Base de Cálculo dos Incentivos Fiscais | sim | Este registro deve ser preenchido pelas pessoas jurídicas ou grupos de empresas coligadas de que trata o art. 9 da Lei n 8.167, de 1991,… |
| N620 | Apuração do IRPJ Mensal por Estimativa | sim | Apresenta o cálculo do IRPJ mensal por estimativa. |
| N630 | Apuração do IRPJ Com Base no Lucro Real | sim | Apresenta o cálculo do IRPJ com base no lucro real. |
| N650 | Base de Cálculo da CSLL Após as Compensações da Base de Cálculo Negativa | sim | Apresenta a base de cálculo da CSLL, após as compensações da base de cálculo negativa. |
| N660 | Apuração da CSLL Mensal por Estimativa | sim | Este registro é habilitado para a pessoa jurídica que apurou o imposto de renda com base no lucro real anual que optou por apurar a CSLL… |
| N670 | Apuração da CSLL Com Base no Lucro Real | sim | Este registro apresenta o cálculo da CSLL com base no lucro real. |
| N990 | Encerramento do Bloco N | sim | **sem descrição no Manual** |
| P001 | Abertura do Bloco P | sim | **sem descrição no Manual** |
| P030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL das Empresas Tributadas pelo Lucro Presumido | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| P100 | Balanço Patrimonial | sim | Apresenta o balanço patrimonial com base nas contas referenciais para o período de apuração. O saldo inicial pode ser replicado do… |
| P130 | Demonstração das Receitas Incentivadas do Lucro Presumido | sim | Este registro deve ser preenchido somente pelas pessoas jurídicas optantes pelo Lucro Presumido que estejam no Refis, de que trata a Lei… |
| P150 | Demonstrativo do Resultado Líquido no Período Fiscal | sim | Apresenta a apuração da demonstração do resultado do exercício. Os valores serão recuperados com base nos registros J051, K355 e K356 se… |
| P200 | Apuração da Base de Cálculo do IRPJ com Base no Lucro Presumido | sim | Apresenta a apuração da base de cálculo do lucro presumido. Observação: Os valores informados neste registro devem considerar os ajustes… |
| P230 | Cálculo da Isenção e Redução do Lucro Presumido | sim | Apresenta o cálculo da isenção e redução do lucro presumido. |
| P300 | Cálculo do IRPJ com Base no Lucro Presumido | sim | Este registro é habilitado para a pessoa jurídica tributada com base no lucro presumido, optante ou não pelo Refis. |
| P400 | Apuração da Base de Cálculo da CSLL com Base no Lucro Presumido | sim | Este registro deve ser preenchido pela pessoa jurídica que apurou a CSLL com base no lucro presumido, em um ou mais trimestres do… |
| P500 | Cálculo da CSLL com Base no Lucro Presumido | sim | Este registro deve ser preenchido pela pessoa jurídica que apurou a CSLL com base no lucro presumido, em um ou mais trimestres do… |
| P990 | Encerramento do Bloco P | sim | **sem descrição no Manual** |
| Q001 | Abertura do Bloco Q | sim | **sem descrição no Manual** |
| Q100 | Demonstrativo do Livro Caixa | sim | Este registro passou a existir a partir do leiaute 2 da ECF, sendo de preenchimento facultativo para o ano-calendário 2015, e passando a… |
| Q990 | Encerramento do Bloco Q | sim | **sem descrição no Manual** |
| T001 | Abertura do Bloco T | sim | **sem descrição no Manual** |
| T030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL das Empresas Tributadas pelo Lucro Arbitrado | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| T120 | Apuração da Base de Cálculo do IRPJ com Base no Lucro Arbitrado | sim | Este registro deve ser preenchido pela pessoa jurídica que apurou imposto de renda pelo lucro arbitrado em um ou mais trimestres do… |
| T150 | Cálculo do IRPJ com Base no Lucro Arbitrado | sim | Este registro deve ser preenchido pela pessoa jurídica que apurou imposto de renda pelo lucro arbitrado em um ou mais trimestres do… |
| T170 | Apuração da Base de Cálculo da CSLL com Base no Lucro Arbitrado | sim | Este registro deve ser preenchido pela pessoa jurídica que apurou a CSLL com base no lucro arbitrado, em um ou mais trimestres do… |
| T181 | Cálculo da CSLL com Base no Lucro Arbitrado | sim | Este registro deve ser preenchido pela pessoa jurídica que apurou a CSLL com base no lucro arbitrado, em um ou mais trimestres do… |
| T990 | Encerramento do Bloco T | sim | **sem descrição no Manual** |
| U001 | Abertura do Bloco U | sim | **sem descrição no Manual** |
| U030 | Identificação dos Períodos e Formas de Apuração do IRPJ e da CSLL das Empresas Imunes e Isentas | sim | Registro de identificação dos períodos da escrituração necessários conforme definições de parâmetros do Bloco 0. |
| U100 | Balanço Patrimonial | sim | Apresenta o balanço patrimonial com base nas contas referenciais para o período de apuração. O saldo inicial pode ser replicado do… |
| U150 | Demonstração do Resultado | sim | Apresenta a demonstração do resultado das empresas imunes e isentas. No caso de entidades fechadas de previdência complementar, será… |
| U180 | Cálculo do IRPJ das Empresas Imunes e Isentas | sim | Apresenta o cálculo do IRPJ das empresas imunes e isentas, no caso de receitas auferidas oriundas de atividades não relacionadas às… |
| U182 | Cálculo da Contribuição Social sobre o Lucro Líquido (CSLL) das Empresas Imunes e Isentas | sim | Este registro deve ser preenchido pelas: a) entidades sem fins lucrativos de que trata o inciso I do art. 12 do Decreto nº 3.048, de 6… |
| U990 | Encerramento do Bloco U | sim | **sem descrição no Manual** |
| V001 | Abertura do Bloco V | sim | **sem descrição no Manual** |
| V010 | DEREX - Instituição | sim | Este registro apresenta as instituições financeiras, o país e a moeda nos quais houve aplicações financeiras, investimentos e pagamento… |
| V020 | Responsável pela Movimentação | sim | Este registro apresenta as informações dos procuradores, representantes ou agentes no exterior, responsáveis pela movimentação das… |
| V030 | DEREX – Período - Mês | sim | Neste registro deve ser informado o mês em que houve aplicações financeiras, investimentos e pagamento de obrigações próprias do exportador. |
| V100 | Demonstrativo dos Recursos em Moeda Estrangeira Decorrentes do Recebimento de Exportações | sim | Este registro informa o código, a descrição e os valores de aplicações financeiras, investimentos e pagamento de obrigações próprias do… |
| V990 | Encerramento do Bloco V | sim | **sem descrição no Manual** |
| W001 | Abertura do Bloco W | sim | **sem descrição no Manual** |
| W100 | Informações sobre o Grupo Multinacional e a Entidade Declarante – Declaração País-a-País | sim | Este registro apresenta as informações sobre o grupo multinacional e a entidade declarante da Declaração País-a-País. Toda entidade… |
| W200 | Declaração País-a-País | sim | Este registro apresenta as informações da Declaração País-a-País. Devem ser indicadas todas as jurisdições nas quais o grupo… |
| W250 | Declaração País-a-País – Entidades Integrantes | sim | Neste registro deve ser apresenta a identificação de todas as entidades integrantes do grupo multinacional (incluindo a própria entidade… |
| W300 | Observações Adicionais – Declaração País-a-País | sim | Registro de utilização opcional pela entidade declarante, caso considere necessário fornecer esclarecimentos adicionais a respeito das… |
| W990 | Encerramento do Bloco W | sim | **sem descrição no Manual** |
| X001 | Abertura do Bloco X | sim | **sem descrição no Manual** |
| X280 | Atividades Incentivadas – PJ em Geral | sim | Este registro deve ser preenchido somente pelas pessoas jurídicas que, de acordo com a legislação vigente, tenham direito à isenção ou… |
| X292 | Operações com o Exterior – Pessoa Não Vinculada/Não Interposta/País sem Tributação Favorecida | sim | Este registro deve ser preenchido pela pessoa jurídica, inclusive instituição financeira ou companhia seguradora, conforme relacionadas… |
| X340 | Identificação da Participação no Exterior | sim | Este registro deve ser preenchido pela pessoa jurídica, tributada pelo lucro real ou arbitrado, domiciliada no Brasil, que tenha, no… |
| X350 | Participações no Exterior – Resultado do Período de Apuração | sim | Este registro deve ser preenchido pela pessoa jurídica domiciliada no Brasil que tenha, no ano-calendário, obtido resultados no exterior… |
| X351 | Demonstrativo de Resultados e de Imposto Pago no Exterior | sim | Este registro deve ser preenchido pelas pessoas jurídicas para demonstrar os resultados e o imposto pago no exterior. Observação: Este… |
| X352 | Demonstrativo de Resultados no Exterior Auferidos por Intermédio de Coligadas | sim | Este registro deve ser preenchido pelas pessoas jurídicas para demonstrar os resultados no exterior de coligadas. Observação: Em… |
| X353 | Demonstrativo de Consolidação | sim | Este registro deve ser preenchido pelas pessoas jurídicas para demonstrar os resultados consolidados no exterior de controladas, diretas… |
| X354 | Demonstrativo de Prejuízos Acumulados | sim | Este registro deve ser preenchido pelas pessoas jurídicas para demonstrar os prejuízos acumulados no exterior de controladas, diretas ou… |
| X355 | Demonstrativo de Rendas Ativas e Passivas | sim | Este registro deve ser preenchido pelas pessoas jurídicas para demonstrar as rendas ativas e passivas no exterior provenientes de… |
| X356 | Demonstrativo de Estrutura Societária | sim | Este registro deve ser preenchido pelas pessoas jurídicas para demonstrar a estrutura societária no exterior de controladas, diretas ou… |
| X357 | Investidoras Diretas | sim | Este registro será preenchido para informar as investidoras diretas das participações informadas no registro X340 quando o campo… |
| X360 | Informações Gerais Sobre Preços de Transferência | sim | Os Registros X360, X365, X366, X370, X371, X375A, X375B, X375C, X375D e X375E devem ser preenchidos por todos os contribuintes que… |
| X365 | Informações Sobre as Contrapartes nas Transações Controladas | sim | **sem descrição no Manual** |
| X366 | Entidades Com as Quais Realiza Transações Controladas | sim | **sem descrição no Manual** |
| X370 | Informações Sobre as Transações Controladas | sim | **sem descrição no Manual** |
| X371 | Informações Sobre Ajustes Compensatórios | sim | Este registro deve ser preenchido quando X370.VL_COMPENSATORIO for maior que zero. Serão informadas as contas contábeis/centros de… |
| X375 | Informações Relacionadas aos Métodos | sim | **sem descrição no Manual** |
| X390 | Origem e Aplicação de Recursos – Imunes e Isentas | sim | Este registro deve ser preenchido pelas pessoas jurídicas imunes ou isentas do imposto de renda. Neste registro, a pessoa jurídica… |
| X400 | Comércio Eletrônico e Tecnologia da Informação – Informações das Vendas | sim | Este registro será habilitado somente para as pessoas jurídicas que efetuaram durante o ano-calendário vendas de bens (tangíveis ou… |
| X410 | Comércio Eletrônico – Informação de Homepage/Servidor | sim | Este registro será habilitado somente para as pessoas jurídicas que efetuaram durante o ano-calendário, por meio da Internet, vendas de… |
| X420 | Royalties Recebidos ou Pagos a Beneficiários do Brasil e do Exterior | sim | Este registro será habilitado somente para as pessoas jurídicas que, durante o ano-calendário, tiveram recebimentos ou pagamentos de… |
| X430 | Rendimentos Relativos a Serviços, Juros e Dividendos Recebidos do Brasil e do Exterior | sim | Este registro será habilitado somente para as pessoas jurídicas, durante o ano-calendário, com rendimentos relativos a… |
| X450 | Pagamentos ou Remessas a Título de Serviços, Juros e Dividendos a Beneficiários do Brasil e do Exterior | sim | Este registro será habilitado somente para as pessoas jurídicas que, durante o ano-calendário, realizaram pagamentos/remessas, a… |
| X451 | Pagamentos ou Remessas a Título de Serviços, Juros e Dividendos a Beneficiários do Brasil e do Exterior – Demais Informações | sim | Este registro será habilitado somente para as pessoas jurídicas que, durante o ano-calendário, realizaram pagamentos/remessas, a… |
| X460 | Inovação Tecnológica e Desenvolvimento Tecnológico | sim | Este registro deverá ser preenchido pela pessoa jurídica que realizou, durante o ano-calendário, atividades de pesquisa tecnológica e… |
| X470 | Capacitação de Informática e Inclusão Digital | sim | Este registro deverá ser preenchido pela pessoa jurídica que tiver investido em atividades de pesquisa e desenvolvimento em tecnologias… |
| X480 | Benefícios Fiscais – Parte I | sim | Este registro deverá ser preenchido pela pessoa jurídica: a) habilitada ao Regime Especial de Tributação para a Plataforma de Exportação… |
| X485 | Benefícios Fiscais – Parte II | sim | **sem descrição no Manual** |
| X490 | Polo Industrial de Manaus e Amazônia Ocidental | sim | Este registro deverá ser preenchido pela pessoa jurídica localizada na área de atuação da Superintendência da Zona Franca de Manaus… |
| X500 | Zonas de Processamento de Exportação (ZPE) | sim | Este registro deverá ser preenchido pela pessoa jurídica autorizada a operar em Zonas de Processamento de Exportação, voltadas para a… |
| X510 | Áreas de Livre Comércio (ALC) | sim | Este registro deverá ser preenchido pelas pessoas jurídicas autorizadas a operar nas Áreas de Livre Comércio (ALC) de Boa Vista, Bonfim,… |
| X990 | Encerramento do Bloco X | sim | **sem descrição no Manual** |
| Y001 | Abertura do Bloco Y | sim | **sem descrição no Manual** |
| Y520 | Pagamentos/Recebimentos do Exterior ou de Não Residentes | sim | Este registro será habilitado somente para as pessoas jurídicas que receberam (0020.IND_REC_EXT = "S") ou pagaram, creditaram,… |
| Y570 | Demonstrativo do Imposto de Renda e CSLL Retidos na Fonte | sim | Neste registro devem ser prestadas informações sobre todo o imposto de renda (IRRF) e contribuição social sobre o lucro líquido (CSLL)… |
| Y590 | Ativos no Exterior | sim | Este registro deve ser preenchido por todas as pessoas jurídicas que possuem ativos no exterior (bens e direitos), salvo quando o valor… |
| Y600 | Identificação e Remuneração de Sócios, Titulares, Dirigentes e Conselheiros | sim | Este registro deve ser preenchido pela pessoa jurídica com os dados dos até 999 (novecentos e noventa e nove) sócios, dirigentes e… |
| Y612 | Identificação e Rendimentos de Dirigentes e Conselheiros – Imunes ou Isentas | sim | Este registro deve ser preenchido pelas imunes ou isentas com dados dos 999 (novecentos e noventa e nove) maiores dirigentes e… |
| Y620 | Participações Avaliadas Pelo Método de Equivalência Patrimonial | sim | Este registro deve ser preenchido pela pessoa jurídica domiciliada no Brasil que teve participações avaliadas pelo método de… |
| Y630 | Fundos/Clubes de Investimento | sim | Este registro deve ser preenchido pelas pessoas jurídicas administradoras de fundos ou clubes de investimento, e pelos fundos de… |
| Y640 | Participações em Consórcios de Empresas | sim | Este registro deve ser preenchido pela pessoa jurídica participante de consórcio constituído nos termos do disposto nos arts. 278 e 279… |
| Y650 | Participantes do Consórcio | sim | Este registro deve ser preenchido quando a pessoa jurídica indicou ser líder de consórcio no registro Y640 (Y640.COND_DECL = “1”).… |
| Y660 | Dados de Sucessoras | sim | Este registro deve ser preenchido pela pessoa jurídica que está obrigada a entregar a ECF relativa às situações especiais de fusão,… |
| Y672 | Outras Informações (Lucro Presumido ou Lucro Arbitrado) | sim | A pessoa jurídica que apurou o imposto de renda com base no lucro presumido (que não recuperaram a ECD) ou arbitrado deve preencher esta… |
| Y680 | Mês das Informações de Optantes pelo Refis (Lucro Real, Presumido e Arbitrado) | sim | Apresenta o mês relativo às informações das empresas optantes pelo REFIS. |
| Y681 | Informações de Optantes pelo Refis (Lucros Real, Presumido e Arbitrado) | sim | Este registro deve ser preenchido pela pessoa jurídica, exceto imune ou isenta, que optou pelo REFIS para os meses em que esteve… |
| Y682 | Informações de Optantes pelo Refis – Imunes ou Isentas | sim | Este registro deve ser preenchido pela pessoa jurídica imune ou isenta que optou pelo REFIS para os meses em que esteve submetida ao… |
| Y720 | Informações de Períodos Anteriores | sim | Este registro é obrigatório para todas as pessoas jurídicas, no caso de transmissão de arquivos da ECF originais. A sua obrigatoriedade… |
| Y730 | Identificação de donatários/destinatários de deduções do IRPJ/CSLL | não | É dever do contribuinte verificar se cumpre os requisitos legais relacionados à dedução que utilizar. Este registro é obrigatório para… |
| Y750 | Informações da ECF Calculadas pelo PGE | sim | Este registro será preenchido pelo próprio PGE da ECF, de acordo com as fórmulas estabelecidas em sua tabela dinâmica. |
| Y800 | Outras Informações | sim | Este registro permite que seja anexado um arquivo em formato texto RTF (Rich Text Format), que se destina a receber informações que… |
| Y990 | Encerramento do Bloco Y | sim | Este registro indica o encerramento do Bloco Y e informa o total de ocorrências dos registros pertencentes ao Bloco Y no arquivo da ECF. |

## Só no leiaute 11

| Registro | Nome | Texto do Manual (início) |
|---|---|---|
| — | — | — |
