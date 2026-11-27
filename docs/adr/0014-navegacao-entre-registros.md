# 0014. Navegação entre registros (26/11/2026)

## Contexto

Etapa 3 do prompt de melhorias (spec `docs/specs/etapa-3-navegacao-registros.md`): andar pelo arquivo sem voltar ao bloco, achar um campo ou uma regra direto e ler a tabela de campos no celular.

## Decisões

- **Anterior e próximo pela ordem do arquivo** (`vizinhos()` em `src/lib/conteudo/leiautes.ts`), no topo e no fim da página. Substituem o anterior/próximo que existia só dentro do bloco (a spec dizia, por engano, que não havia nenhum). Atravessam blocos, e a ordem é a do leiaute do ano.
- **Mapa do bloco** em coluna lateral fixa a partir de 1280 px; abaixo disso, seletor "Ir para o registro". A posição no arquivo aparece acima do título.
- **Âncora pelo nome do campo** (`ancorasDosCampos()`): `#cod-scp`, e nome repetido ganha o número. Os links antigos `#campo-N` são trocados pela âncora nova ao abrir e ao mudar a âncora, sem recarregar.
- **Âncora por regra** (`ancorasDasRegras()`): cada regra tem endereço próprio, e a busca leva direto a ela.
- **Regras visíveis nos dois níveis.** Antes ficavam só em "Já conheço"; a busca por regra levaria a uma seção escondida. No nível "Estou começando", uma frase explica que o texto é técnico.
- **Cartões no celular com a mesma marcação da tabela:** abaixo de 768 px, cada linha vira um cartão por CSS, com o rótulo da coluna em `data-rotulo`. As âncoras não se duplicam.
- **Copiar** (`BotaoCopiar`): link do campo e linha do exemplo, com aviso visível e em `role="status"`. Sem acesso à área de transferência, mostra o texto selecionado.
- **Busca:** tipo novo "regra" e resultados agrupados por tipo, com título de grupo (`role="group"` dentro do `listbox`). Os grupos seguem a ordem do melhor resultado; o teclado continua andando por uma lista só. O nome exato do campo pesa mais.
- **Glossário:** dicas em "Para que serve", na descrição oficial e nas regras, só com os 41 termos que já existem.

## Consequências

- O índice da busca cresceu com cerca de 770 regras por ano e continua abaixo de 600 KB.
- Testes antigos que usavam `#campo-4` ou buscavam só registros e campos foram ajustados.
