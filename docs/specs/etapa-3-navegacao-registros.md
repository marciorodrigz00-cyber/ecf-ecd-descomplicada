# Spec: Etapa 3, navegação entre registros

Status: **aprovada** · 26/11/2026

Origem: `prompt-melhorias-ecf.md`, etapa 3.

## O que já existe

- Cada linha da tabela de campos tem âncora numérica (`/blocos/0/0035#campo-2`), e a linha marcada fica realçada.
- A busca (Ctrl K) já acha blocos, registros, campos (`0035.COD_SCP`), termos do glossário, seções e novidades. Não acha regras.
- Dicas do glossário (`comTermos`) aparecem nas páginas de bloco, seções, exemplos e novidades, mas não na página de registro.
- A página de registro não tem anterior/próximo, nem mapa do bloco, nem botões de copiar.
- A tabela de campos tem 8 colunas e rola de lado no celular, dentro da própria caixa.

## 1. Anterior e próximo

- **Botões** "← 0030 · 0930 →" no topo e no fim da página do registro, com o código e o nome.
- **Ordem do arquivo** (a do leiaute), atravessando blocos: no último registro do bloco 0, o "próximo" é o primeiro do bloco seguinte, com o aviso "Bloco C". O primeiro registro do arquivo não tem "anterior"; o último não tem "próximo".
- **Ano:** a ordem é a do leiaute do ano da página. No AC 2024, um registro que só existe em 2025 nunca aparece.
- **Teclado:** são links comuns, sem tecla nova (já há atalhos de letra; mais teclas viram conflito).

## 2. Mapa do bloco

- **Tela larga (1280 px ou mais):** coluna lateral fixa com os registros do bloco, na ordem, e o atual marcado (`aria-current`). Embaixo, links para o bloco anterior e o seguinte.
- **Telas menores:** no topo da página, um seletor "Ir para o registro" com os registros do bloco.
- **"Onde estou no arquivo":** uma linha com a posição ("Bloco M, 3º de 18 registros · bloco 9º de 17 no arquivo").

## 3. Âncora por campo

- **Formato:** `/blocos/0/0035#cod-scp`, com o nome do campo em minúsculas e `_` virando `-`. Se um nome se repetir no mesmo registro, a segunda ocorrência ganha o número (`#valor-2`). Um teste confere que não há repetição sem número.
- **Links antigos** (`#campo-2`) continuam funcionando: ao abrir, a página troca para a âncora nova, sem recarregar.
- **Botão "Copiar link do campo"** em cada campo. Ele avisa "Link copiado" para quem vê e para o leitor de tela. Se o navegador não deixar copiar, mostra o link selecionado para copiar à mão.
- **Busca:** os resultados de campo passam a usar a âncora nova.

## 4. Copiar a linha de exemplo

Botão "Copiar linha" na linha explicada, com o mesmo aviso. Copia o texto exato `|0035|11111111000291|SCP TESTE 1|`.

## 5. Campos no celular

- **Abaixo de 768 px**, a tabela vira cartões, um por campo: nome, número, tipo, tamanho, decimais, valores válidos, obrigatório e descrição, sem rolagem lateral.
- **De 768 px para cima**, continua a tabela.
- **É a mesma marcação, mudando só o estilo:** as âncoras não se duplicam e o leitor de tela recebe o mesmo conteúdo.

## 6. Busca por campo e por regra

- **Campo:** digitar só `COD_SCP` precisa achar `0035.COD_SCP` e os outros campos com esse nome. Um teste garante isso.
- **Regra:** cada `REGRA_…` do Manual entra no índice, com o registro e o campo, e leva à seção "Regras" do registro.
- **Resultados agrupados**, com título de grupo: blocos, registros, campos, regras, termos, seções e novidades. O grupo "Incentivos" entra na etapa 4.
- **Tamanho do índice:** o leiaute 12 tem cerca de 770 regras (contando cada campo). O índice continua sendo baixado só quando a busca é aberta, e um teste limita o tamanho dele.

## 7. Glossário na página de registro

- **Onde as dicas passam a aparecer:** "Para que serve", na descrição oficial e no texto das regras, usando os termos que já existem no glossário (41, entre eles e-Lalur, e-Lacs, DEREX, SCP e PGE). Cada termo ganha dica só na primeira vez que aparece em cada seção.
- **Sem termos novos:** não acrescento termos ao glossário nesta etapa, porque cada um precisaria de fonte. Se faltar algum importante, eu listo para você decidir.

## Testes

- **CT:**
  - anterior/próximo, incluindo a virada de bloco, o primeiro e o último registro e o AC 2024;
  - mapa do bloco e seletor;
  - âncora nova, âncora antiga redirecionada e cópia do link;
  - copiar a linha;
  - busca por `COD_SCP` e por `REGRA_CNPJ_DIFERENTE_SCP`, com grupos.
- **CN:** âncoras únicas em todos os registros dos dois anos; toda regra do Manual está no índice.
- **AC:**
  - botões de copiar com nome e aviso;
  - mapa com `aria-current`;
  - cartões de campo e dicas do glossário pelo teclado;
  - axe nos dois temas.
- **RS:** registro com muitos campos (0000 e M300) em 375, 768, 1050 e 1440 px, sem rolagem lateral da página.
- **RD:** índice da busca abaixo do limite e baixado só ao abrir a busca.

## Fora desta etapa

Grupo "Incentivos" na busca (etapa 4); termos novos no glossário; teclas novas de atalho.

## Decisões que preciso de você

1. **Âncora pelo nome do campo** (`#cod-scp`), com os links antigos redirecionados. Recomendo.
2. **Mapa lateral só a partir de 1280 px**, com seletor no topo nas telas menores. Recomendo.
3. **Cartões de campo abaixo de 768 px.** Recomendo.
4. **Sem termos novos no glossário nesta etapa**, só as dicas dos que já existem. Recomendo.
