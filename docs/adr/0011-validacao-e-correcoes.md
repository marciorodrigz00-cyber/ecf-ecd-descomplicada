# 0011. Validação pós-publicação e correções (25/11/2026)

## Contexto

Depois de publicado, o site foi validado tendo como norte o relatório de testes de outro projeto do usuário: parâmetros mantidos, adaptados ou acrescentados conforme o nosso contexto. Resultado: 5 defeitos de severidade Baixa. Quatro foram corrigidos aqui; o quinto (BUG-028, texto sem acento na página do GitHub) depende do dono do repositório.

## Decisões

- **BUG-025, cache.** `vercel.json` guarda por um ano só `/_next/static/`, cujos nomes mudam com o conteúdo. Páginas e dados seguem reconferidos. O servidor local simulava essa regra e escondia a falta dela: agora ele só aplica o que está no `vercel.json`, cada regra no seu caminho.
- **BUG-026, rolagem.** O `Link` do Next mantém a rolagem quando a página nova já está visível (Context7, `/vercel/next.js`, link.mdx). Ao trocar de caminho por link, o cabeçalho leva ao topo junto com o foco no título. Voltar, Avançar e âncoras ficam como o navegador faz.
- **BUG-027, seleção no endereço.** `src/lib/parametros.ts` guarda bloco, regime e aba do mapa e os filtros de novidades, blocos e glossário em `?…`, com `history.replaceState(null, …)`, que o Next integra ao roteador. Valor padrão não aparece. Todo valor lido passa por uma lista fechada; o termo do glossário é texto, cortado em 60 caracteres, e só vai para o campo. Usar `replace` evita encher o histórico.
- **Endereço que muda na mesma página** (clicar na marca, por exemplo): um componente sem tela usa `useSearchParams` dentro de `Suspense`, padrão documentado para páginas geradas. Só ele fica fora do HTML.
- **Simulador fora do endereço**, de propósito: são valores digitados pela pessoa.
- **BUG-024, teste lento.** SG-027 lê o site inteiro; ganhou 60 s.

## Consequências

- Um link como `/?regime=presumido&bloco=Q` pode ser compartilhado. Quem prefere 2024 é levado a `/ac/2024` com a mesma seleção.
- O endereço canônico não muda: os parâmetros não criam páginas novas para buscadores.
- Medições locais de desempenho passam a refletir o cache real.
