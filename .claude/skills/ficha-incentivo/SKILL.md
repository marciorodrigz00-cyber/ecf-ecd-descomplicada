---
name: ficha-incentivo
description: Passo a passo para pesquisar, preencher, classificar e testar uma ficha de incentivo fiscal (content/incentivos/<id>.json) diante da LC nº 224/2025 e das leis que a alteraram. Use ao criar, corrigir ou atualizar um incentivo da página "Incentivos fiscais".
---

# Ficha de incentivo

A ficha diz o que é o incentivo, quem usa, como funciona, a situação diante da redução linear em cada ano-calendário e onde ele aparece na ECF. O schema é `Incentivo`, em `src/schemas/index.ts`; o carregador `src/lib/conteudo/incentivos.ts` confere fontes, regras e registros no build.

## 1. Pesquisar

1. Leia a lei do incentivo no Planalto e anote o dispositivo (artigo, parágrafo, inciso).
2. Veja se o incentivo está no Anexo Único da IN RFB nº 2.305/2025 (portal de normas, consulta 148694; abre só em navegador). Estar no Anexo significa "fora da redução" ou "não é benefício" (art. 17).
3. Procure o incentivo no Perguntas e Respostas da Receita (versão mais recente) e nas exceções do art. 4º, § 8º, da LC nº 224/2025.
4. Se não houver resposta nas fontes, a situação é "a verificar". Diga em `falta` o que conferir, por exemplo o demonstrativo de gastos tributários da LOA.

## 2. Classificar

| Situação | Quando usar |
|---|---|
| `reduzido` | está no demonstrativo de gastos tributários ou nos regimes do § 2º, II, e não foi excetuado |
| `excetuado` | está no Anexo Único por exceção do § 8º, ou numa exceção da própria lei |
| `nao-beneficio` | está no Anexo Único por não ser benefício (art. 17, II) |
| `a-verificar` | as fontes lidas não resolvem |

## 3. Preencher

- `porAno`: uma entrada por ano-calendário, com efeito, regras de `content/regras/lc224.json`, status e fonte. A camada da LC nº 239/2026 (AC 2027) fica "a verificar" até haver orientação da Receita Federal.
- `registros`: códigos do leiaute 12 onde o incentivo aparece. O build recusa código que não existe.
- `regimes`: deixe vazio se as fontes não disserem quais regimes podem usar.
- `exemplo`: só com números de uma fonte oficial (Perguntas e Respostas, Manual). A conta é feita por `src/lib/calculo/lc224.ts`; acrescente o caso em `tests/unit/etapa4.test.ts`, com o resultado calculado à mão.
- Textos: nada de percentual ou nome de norma escrito em componente; eles vêm dos dados.

## 4. Conferir

```
npm run validar:conteudo
npx vitest run tests/unit/etapa4.test.ts
```

Depois, peça a revisão ao agente `revisor-fiscal`. Status "revisado" só com contador.
