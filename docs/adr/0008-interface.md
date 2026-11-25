# ADR 0008: interface em preto e verde, com o mapa na entrada

25/11/2026. Decidido com o usuário sobre a referência dele (console com mapa de fluxo) e o protótipo `docs/prototipos/console-v1.html`. Context7: `/vercel/next.js` (route handler estático em `output: 'export'`). Nenhuma biblioteca nova.

| Decisão | Como ficou |
|---|---|
| Cores | Preto e verde #86BC25, próximos dos usados pela Deloitte, a pedido. Só a inspiração de cor: nenhum nome, logotipo, fonte ou elemento da marca. Fontes de terceiros divergem em #86BC24 e #86BC25, e não foi achado guia oficial |
| Tema claro | Verde mais escuro (#3F6B0C), porque #86BC25 sobre branco não tem contraste para texto |
| Tema inicial | Escuro, em vez de seguir o sistema |
| Cores dos blocos | Um verde só; o grupo aparece no nome e no ícone |
| Página inicial | Mapa de fluxo, painel do bloco, trilha, novidades e atalhos |
| Regimes | O mapa se refaz por regime, a partir da matriz conferida. A referência dizia que P, Q, T e U "substituem" L, M e N, o que não é exato |
| Percurso | Anda sozinho, com pausa; com "menos movimento" ligado, só avança à mão |
| Conquistas | Oito, calculadas das preferências salvas no navegador. Nada é enviado |
| Atalhos S, Q e G | Podem ser desligados (WCAG 2.1.4), e não agem em campos |
| Ano-calendário | Links em vez de lista, porque cada ano é um endereço |
| Busca Ctrl+K | Fica para a fase 7; não há campo sem função no cabeçalho |

## Exemplo dentro do registro

- Fontes, nesta ordem: linha das empresas fictícias (só AC 2025), linha ilustrativa deste site (só quando nenhuma outra pode ser lida campo a campo) e linha de exemplo do Manual.
- Cobertura no leiaute 12: 178 de 180 registros, dos quais 158 com exemplo fictício ou do Manual. As linhas ilustrativas ficam em `content/exemplos/ilustrativos.json`, usam os números da Móveis Aurora e passam pelo validador do leiaute no build.
- Sem exemplo: Y750 e 9100, que só o programa preenche e cujos códigos não estão nas fontes lidas.
- A verificar: `C040.COD_VER_LC` e `X340.TIP_MOEDA`, que dependem de tabelas não encontradas. Ficam em branco, com aviso.
- A linha só é separada em campos se a quantidade bater com a tabela do registro.
- A leitura que o Manual faz dos valores só entra se **todos** baterem, na ordem. No 0000 ela cita 0009 para uma linha que traz 0011, e por isso não é usada.
- Os dados saem em `/dados/{ano}/{bloco}.json`, estáticos, e só são buscados ao abrir um registro.
