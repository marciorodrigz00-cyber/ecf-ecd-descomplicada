# Spec: Etapa 2, perfil de entrada e home enxuta

Status: **aprovada** · 26/11/2026

Origem: `prompt-melhorias-ecf.md`, etapa 2.

## O que já existe

- **Preferências no navegador** (`src/lib/preferencias/modelo.ts`): nível, tema, ano, seções estudadas, blocos e registros abertos, conquistas e atalhos. Tudo validado ao ler.
- **Ano na URL**, que vence a preferência. A preferência só leva de `/` para `/ac/2024` (ADR 0001).
- **Regime:** só como parâmetro de endereço nas páginas de blocos e no roteiro `/preencher`. Não é guardado.
- **Home:** topo, trilha, novidades, atalhos, conquistas e "o que fazer agora", com o prazo.
- **Menu:** O que é, Importância, Quem entrega, Blocos, Exemplos, Simulador, Novidades e Glossário.

## 1. Perfil

**Três perguntas**, todas puláveis:
- **Regime:** lucro real, presumido, arbitrado, imune, isenta, ou "ainda não sei".
- **Nível:** começando ou profissional.
- **Ano-calendário:** 2025 ou 2024.

**Onde aparece:** na primeira visita, um **cartão no topo da home**, sem janela por cima da página. Some quando respondido ou ao clicar em "Pular". O botão **"Meu perfil"** no cabeçalho reabre as perguntas em qualquer página.

**Onde fica guardado:** no navegador, junto das preferências que já existem. Ganha o campo `regime` e o marco "perfil respondido ou pulado". As preferências antigas continuam válidas.

**O que se ajusta:**
- **Blocos:** o filtro de regime já vem com o regime do perfil. Um regime escrito no endereço continua vencendo, para links compartilhados funcionarem.
- **/preencher:** abre no roteiro do regime do perfil.
- **Nível:** igual a hoje.
- **Ano:** igual a hoje (a URL vence). Ao mudar o ano no perfil, a página atual vai para o mesmo endereço no ano escolhido.

O conteúdo que depende do perfil aparece depois que a página carrega no navegador (o site é estático). Para não pular na tela, o espaço fica reservado.

## 2. Home enxuta

**No topo, só dois caminhos grandes:**
- **"Estou aprendendo":** leva à próxima seção não estudada da trilha (começa em "O que é").
- **"Vou preencher":** leva ao roteiro do regime do perfil. Sem perfil, pergunta o regime antes.

**Depois, nesta ordem:**
1. Prazo do ano.
2. Novidades.
3. Mapa de fluxo.
4. Destaque de incentivos fiscais (entra na etapa 4).

**Página nova "Meu progresso"** (`/meu-progresso`): recebe conquistas, atalhos e progresso da trilha. Quem acabou de chegar não vê contadores em zero: a página mostra um convite para começar, e os números só aparecem depois da primeira seção estudada ou do primeiro bloco aberto.

## 3. Menu principal

Nova ordem: **O que é · Quem entrega · Blocos · Incentivos fiscais · Exemplos · Simulador · Novidades · Glossário · Fontes**.

- **"Importância"** sai do menu e passa a ser um link destacado dentro de "O que é". O endereço `/importancia` continua funcionando.
- **"Incentivos fiscais"** entra no menu só quando a etapa 4 tiver conteúdo. Nada de item que leve a uma página vazia.
- **"Fontes"** entra no menu (a página `/fontes` já existe).
- **"Meu progresso"** fica perto de "Meu perfil", no cabeçalho, e não no menu principal.

## 4. Cartões de bloco

Cada cartão mostra:
- **Número de registros do bloco** no ano escolhido.
- **Regimes em ícones**, cada um com o texto ao lado ou como nome acessível. Nada só por cor ou só por ícone.
- **Situação para o regime do perfil.**

**Vocabulário da situação:** o prompt pede "obrigatório / condicional / não se aplica". Os dados do site (tabela do Manual) dizem se o bloco é **previsto**, **depende de condição** ou **não é previsto** para o regime. "Previsto" não é o mesmo que "obrigatório": um bloco previsto pode ter só a abertura e o encerramento. Recomendo usar o vocabulário que os dados sustentam:
- "Previsto para o seu regime";
- "Depende de uma condição";
- "Não se aplica ao seu regime".

## Testes

- **CT:**
  - perfil respondido, pulado e alterado;
  - persistência depois do F5;
  - regime do perfil × regime no endereço;
  - os dois caminhos da home;
  - "Meu progresso" sem e com progresso;
  - menu na ordem nova.
- **AC:** cartão de perfil e botão "Meu perfil" pelo teclado, foco ao abrir e ao fechar, axe nos dois temas.
- **RS:** 375, 768, 1050 e 1440 px.
- **SG:** valores do perfil lidos do navegador passam por uma lista fechada (como os de hoje).
- **RD:** perfil corrompido no navegador volta ao padrão sem erro.

## Fora desta etapa

O conteúdo de incentivos (etapa 4); o checklist por perfil (etapa 6).

## Decisões que preciso de você

1. **Perfil em cartão no topo da home**, sem janela por cima. Recomendo.
2. **Vocabulário da situação:** "Previsto / Depende de uma condição / Não se aplica ao seu regime", em vez de "obrigatório". Recomendo, porque é o que a tabela do Manual sustenta.
3. **"Incentivos fiscais" no menu só quando a etapa 4 existir.** Recomendo.
4. **"Meu progresso" no cabeçalho**, ao lado de "Meu perfil". Recomendo.
