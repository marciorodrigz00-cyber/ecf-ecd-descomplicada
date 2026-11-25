# ADR 0001: site 100% estático

- Data: 24/11/2026
- Status: aceita (aprovada com a fase 1)

## Contexto

O conteúdo legislativo deve ser gerado em build, e os requisitos de segurança são rígidos com rotas de API e painéis.

## Decisão

Next.js com `output: 'export'`, sem rotas de API. Rascunhos do monitor são revisados por Pull Request. CSP por hash: meta por página, calculada após o build, e demais cabeçalhos no `vercel.json`.

## Consequências

- Os casos SG de API passam a provar que a superfície não existe.
- O ano-calendário vive na URL, porque não há servidor para ler cookie.
- A viabilidade da CSP por hash precisa ser provada num spike na fase 2, consultando o Context7.
