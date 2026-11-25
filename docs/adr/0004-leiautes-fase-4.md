# ADR 0004: extração dos leiautes (fase 4)

- Data: 24/11/2026

## Fontes

| Item | Origem | Versão |
|---|---|---|
| Manual do leiaute 12 (Word e PDF) | gov.br/sped, HTTPS | 23/07/2026 |
| Manual do leiaute 11 (PDF) | gov.br/sped, HTTPS | 29/09/2025 |
| Manual do leiaute 11 (Word) | portal SPED antigo, HTTP | mesma data; usado na extração e conferido com o PDF |
| Tabelas dinâmicas do leiaute 12 | gov.br/sped, HTTPS | página atualizada em 24/09/2026, arquivo de 28/05/2026 |

O portal antigo oferecia o Manual do leiaute 12 de **20/05/2026**, desatualizado. As citações da fase 3 foram reconferidas na versão nova e não mudaram.

## Extração

`tools/extrair-leiaute/` lê o .docx sem dependências, ignora texto riscado e excluído, junta linhas partidas e só altera tipografia (ordinais e "nº"). Uma correção de digitação está em `CORRECOES` (9099 → 9990). Divergências dos próprios manuais: `content/divergencias.json`, exibidas em `/fontes`.

## Conferência

Comparação com o PDF oficial lido por outro programa (pdfjs, usado fora do projeto):

- linhas de campo idênticas por inteiro: 1.066 de 1.078 (leiaute 12) e 1.057 de 1.067 (leiaute 11); as demais são quebras de página, conferidas por leitura;
- regras de validação idênticas: 769 de 773 e 753 de 756; as demais têm início e fim iguais e quebra de página no meio. Contagens feitas antes de descartar regras repetidas no registro 0000;
- não conferidos por esse caminho: descrição introdutória, ocorrência e exemplos, que vêm só da extração.

Por isso o selo é "conferido com a fonte", não "revisado".

## Decisões

- `/ac/<ano padrão>` não é mais gerado: redireciona para a URL curta, com expressão restrita para não virar redirecionamento aberto.
- O campo 0010.FORMA_TRIB mantém a opção 10 (TEF), porque é o texto oficial do registro 0010. O bloco S e seus registros seguem fora.
- As linhas das tabelas dinâmicas não foram importadas: entram, só as necessárias, na fase 5.
- Nenhuma biblioteca nova; sem nova consulta ao Context7.
