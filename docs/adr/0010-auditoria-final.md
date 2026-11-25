# ADR 0010: auditoria final e preparo da publicação

25/11/2026. Context7: `/googlechrome/lighthouse`. O Lighthouse 13.6.0 rodou fora do projeto: não entra nas dependências.

## O que a auditoria acrescentou

- Varredura de todo o site gerado: links e âncoras, títulos, ids, avisos, texto em inglês, recursos externos e conteúdo sensível.
- axe em toda página que não é de registro e em amostra das de registro, nos dois temas.
- Foco visível por teclado, armazenamento cheio ou bloqueado, pedidos duplicados, rajada de 20 leituras.
- Arquivos versionáveis sem dado pessoal, segredo ou arquivo indevido, porque o repositório será público.
- Lighthouse em nove páginas (`tests/lighthouse.json`), no servidor local, que passou a comprimir como a Vercel.

## Decisões

| Tema | Decisão |
|---|---|
| Nome | "ECF e ECD Descomplicada", escolhido pelo usuário. Como não há conteúdo de ECD, o aviso aparece na entrada e no rodapé de toda página |
| Troca de ano | Registro que não existe no outro leiaute leva ao bloco; endereço desconhecido, ao início |
| Contato de segurança | Página de segurança do GitHub (`SECURITY.md`). O `security.txt` sai com `SECURITY_CONTACT` |
| Autoria | Nome "Marcio", com o e-mail noreply do GitHub |
| Publicação | Vercel, com repositório público. Nada é publicado sem perguntar |

## O que só dá para verificar publicado

Cabeçalhos reais, HSTS, cache e resposta 405 da Vercel; execução dos workflows no GitHub; leitor de tela real, outros navegadores e aparelhos físicos.

## Primeira publicação (25/11/2026)

- **CI no Linux:** 137 testes unitários e 119 de navegador aprovados na primeira execução.
- **Monitor no GitHub:** `www.gov.br` respondeu `ECONNRESET` nas seis fontes; as outras duas foram lidas. O monitor acusou a falha, como devia. Passou a rodar no Windows.
- **Vercel:** a primeira publicação de um projeto vai sempre para produção, por isso ela foi uma página provisória. A prévia do site confirmou cabeçalhos, HSTS, compressão, 404, redirecionamentos e `security.txt`.
- **Fora dos buscadores** com `OCULTAR_DE_BUSCADORES`, até haver revisão. O `robots.txt` deixa ler, para o robô ver o `noindex`.
- A Vercel acrescenta `Access-Control-Allow-Origin: *` aos arquivos estáticos. Todo o conteúdo é público e não há cookie nem login: risco baixo, registrado.
- O 405 não foi testado na Vercel: a regra de execução só permite GET e HEAD fora do computador.
