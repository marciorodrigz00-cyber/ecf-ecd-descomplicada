---
name: roteiro-preenchimento
description: Passo a passo para escrever ou revisar um roteiro de simulação de preenchimento (content/roteiros/<bloco>/<registro>.json), do registro do Manual ao teste. Use ao criar, corrigir ou ampliar a seção "Veja o preenchimento" de um registro da ECF.
---

# Roteiro de preenchimento

Um roteiro guarda só o que não sai dos dados do site. Tipo, tamanho, decimais, valores válidos, obrigatoriedade e regras vêm do leiaute extraído (`content/leiautes/<n>/registros/<letra>.json`). A linha `|REG|…|` é sempre gerada por código (`src/lib/simulacao/arquivo.ts`), nunca escrita à mão.

## Antes de escrever

1. Descubra o leiaute do ano em `content/leiautes/anos.json` e abra o registro no arquivo do bloco: campos, `exemplo`, `regrasRegistro` e `regrasCampo`.
2. Escolha a empresa:
   - `manual`: os dados de teste do Manual. A linha gerada precisa ser **igual** a `exemplo[0]`. Se um dado do Manual tiver de ser trocado para o exemplo fazer sentido, diga isso em `empresa.aviso`.
   - `lucro-real`: Móveis Aurora (`content/exemplos/lucro-real.json`). A linha vem do gerador do site; escolha uma linha que exista no arquivo montado.
3. Leia o texto de cada regra no Manual. Nada de regra inventada: se o Manual for ambíguo ou contraditório, registre em `content/divergencias.json` e marque a regra como não simulada, com `motivo`.

## Campos do arquivo

Schema `Roteiro` em `src/schemas/index.ts`. Em resumo:

- `rastreio`: fonte, norma, leiautes, vigência, `verificadoEm` (data de hoje) e `status: "conferido"`. Nunca `revisado`: isso é do contador.
- `linha.campos`: só os campos do registro (sem REG). Campo omitido fica vazio.
- `extras`: valores de outros registros que as regras consultam, como `"0000.CNPJ"`.
- `fatos`: o que a ficha da empresa mostra, com os campos que cada fato explica.
- `decisao`: a pergunta de obrigatoriedade, ou `null` quando o registro é sempre gerado.
- `regras`: **todas** as regras do Manual para o registro, e só elas. `simulada: true` exige a função em `src/lib/simulacao/regras.ts`, indexada por `"REG.CAMPO:CODIGO"` (campo `*` para regra de registro). `simulada: false` exige `motivo` (ex.: "compara com o registro E010, que não está no cenário").
- `erro`: um valor errado num campo que falha **exatamente** na regra indicada, respeitando o formato do campo. Explicação e como corrigir, nos dois níveis.
- `paraQueServe`: texto didático próprio, nos dois níveis.

Todo texto tem `iniciante` e `profissional`. Iniciante sem jargão; profissional com códigos de campo e regra.

## Regra nova no motor

Uma função pura em `regras.ts`, com o texto do Manual em comentário ao lado e casos feitos à mão em `tests/unit/etapa5.test.ts` (passa, falha e limite). Dinheiro em centavos, nunca em ponto flutuante.

## Conferência

- Ao salvar, o hook de conteúdo confere schema, caminho, campos, cobertura das regras e formato do valor de erro; na origem `manual`, também a linha igual à do Manual e os dois cenários. Falhou: código 2 com a explicação.
- Depois rode `npm run validar:conteudo`, `npx vitest run tests/unit/etapa5.test.ts` e `npm run build` (o build monta todos os roteiros e falha em qualquer inconsistência).
- Peça ao agente `revisor-fiscal` que confira o roteiro contra o Manual. Revisão por agente não muda o status: o máximo continua "conferido".
