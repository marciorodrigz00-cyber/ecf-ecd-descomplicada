# ADR 0005: exemplos e simulador (fase 5)

- Data: 25/11/2026

## Fontes lidas

| Norma | Uso |
|---|---|
| Lei nº 9.249/1995, arts. 3º, 15 e 20 | IRPJ, adicional, percentuais de presunção |
| Lei nº 7.689/1988, art. 3º, III | CSLL das demais pessoas jurídicas |
| Lei nº 9.065/1995, arts. 15 e 16 | Limite de compensação |
| Lei nº 9.430/1996, art. 1º | Períodos trimestrais |
| IN RFB nº 1.700/2017, arts. 61, 70, 132, 214 e 215 | Lucro real, provisões, multas, presumido |
| Tabelas dinâmicas dos leiautes 12 e 11 | Fórmulas de M300, N500, N630, N670, P200 a P500 e linhas usadas |

A IN RFB nº 2.315/2026 revogou o art. 30 da IN 1.700 (alíquotas da CSLL) e a IN RFB nº 2.343/2026 alterou o art. 33. Por isso alíquotas e percentuais citam as leis, e não esses artigos.

## Decisões

- Cálculo em `src/lib/calculo`, sem número fiscal no código: tudo vem de `content/regras/tributos.json`.
- Dinheiro em centavos `bigint`. Arredondamento ao centavo, metade para cima, marcado como **a verificar**: o material lido não define a regra do programa. Os exemplos usam números que não dependem dela.
- Os exemplos são montados em build a partir de lançamentos contábeis, e cada linha é conferida com o leiaute. Linha fora do leiaute derruba o build.
- Simulador trimestral, lucro real e presumido. Fora: anual por estimativa, incentivos, atividade rural, instituições financeiras e as regras da LC 224/2025.
- Arquivos dos exemplos: só blocos com dados. Sem C e E (recuperados), sem bloco 9, sem 001/990 de blocos vazios. Com o Bloco S fora do escopo, um arquivo "completo" do leiaute 12 não seria fiel.
- CNPJ e CPF inválidos de propósito, com teste que calcula o dígito.
- Nenhuma biblioteca nova; sem nova consulta ao Context7.
- A interface não foi redesenhada: a conversa com o usuário sobre isso segue pendente. Dados e cálculo estão separados das telas.
