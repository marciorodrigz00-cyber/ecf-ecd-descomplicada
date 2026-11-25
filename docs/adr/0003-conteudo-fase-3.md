# ADR 0003: conteúdo da fase 3

- Data: 24/11/2026

## Fontes lidas

| Norma | Onde | Resultado |
|---|---|---|
| IN RFB nº 2.004/2021 | Portal Normas, texto vigente, lido no navegador | Lida por inteiro. Os "Vide" do art. 3º são prorrogações de prazo |
| IN RFB nº 2.274/2025 | Busca do Portal Normas | Altera a IN 1.781/2017 (Repetro-Sped). **Não trata da ECF** |
| Decreto-Lei nº 1.598/1977, art. 8º-A | Planalto | Texto compilado |
| Lei nº 8.218/1991, art. 12 | Planalto | Redação da Lei nº 13.670/2018 |
| Manuais dos leiautes 12 e 11 | Portal SPED antigo (HTTP) | Trechos usados conferidos nos dois |

## Decisões

- Textos em **JSON**, não em MDX: os textos são curtos, o Zod valida que toda seção cita ao menos uma regra, e evita três dependências. O requisito aceita MDX ou JSON.
- Nenhuma biblioteca nova nem mudança de uso, portanto sem nova consulta ao Context7.
- O quiz segue a IN, não o resumo do item 1.30 do Manual, que fala só das inativas.
- Cruzamentos: a página só afirma os vínculos escritos em norma (ECD, ECF anterior e DCTF).
- Códigos de receita das multas (3624) não foram publicados: não são necessários ao estudo e podem mudar.
