# ECF e ECD Descomplicada

Plataforma educacional em português sobre a Escrituração Contábil Fiscal (ECF). O nome inclui a ECD, cujo conteúdo ainda não existe. Conteúdo educacional: não substitui orientação de profissional contábil nem a legislação oficial.

- Requisitos: [docs/requisitos.md](docs/requisitos.md)
- Arquitetura: [docs/plano-fase-1.md](docs/plano-fase-1.md)
- Decisões: [docs/adr/](docs/adr/)

## Como rodar

Precisa do Node 24. No PowerShell, se a política de scripts barrar `npm`, use `npm.cmd`.

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Abre o site em modo de desenvolvimento |
| `npm run build` | Gera o site estático em `out/` |
| `npm run serve` | Serve `out/` em http://127.0.0.1:4173, com os cabeçalhos do `vercel.json` |
| `npm run typecheck` | Confere os tipos |
| `npm run lint` | Roda o Oxlint; aviso também reprova |
| `npm test` | Testes unitários (Vitest) |
| `npm run e2e` | Testes de ponta a ponta (Playwright, com o Chrome instalado) |
| `npm run validar:conteudo` | Valida todo o `content/` com as mesmas regras do hook 1 |
| `npm run monitor` | Lê as fontes oficiais e prepara rascunhos em `monitor/` (com `-- --seco`, só mostra) |
| `npm run relatorio` | Gera `relatorio-testes-ecf.html` |

## Hooks do projeto

Os hooks do Claude Code estão em [.claude/settings.json](.claude/settings.json) e os scripts, em Node, em [.claude/hooks/](.claude/hooks/). Eles só valem quando a pasta aberta no Claude Code é a deste projeto, e o `node` precisa estar no PATH.

| Hook | Quando roda | O que faz |
|---|---|---|
| 1. `validar-conteudo.mjs` | Depois de editar um arquivo (`Edit`, `Write`) | Se o arquivo está em `content/`, valida com o schema Zod e exige fonte oficial, norma, leiaute, ano-calendário e data da verificação. Falhou: devolve o arquivo, o item e os campos que faltam. Item com `"status": "a-verificar"` passa, com aviso. |
| 2. `bloquear-sensivel.mjs` | Antes de um comando ou edição (`Bash`, `PowerShell`, `Edit`, `Write`) | Bloqueia `.env*` e outros arquivos de segredo, `git push`, publicação (Vercel, npm), remoção recursiva fora de pastas geradas, instalação global e login em serviços. Para seguir, uma pessoa executa a ação. |
| 3. `exigir-testes.mjs` | Quando o agente vai encerrar (`Stop`) | Roda typecheck, lint e testes unitários. Falhou: o agente recebe um resumo de até 40 linhas e continua. Os testes de ponta a ponta ficam para o fim de cada fase. |

### O que eles não cobrem

- O hook 1 só vê edições feitas com `Edit` e `Write`. Conteúdo gerado por script é conferido no encerramento, porque os testes unitários validam todo o `content/`.
- O hook 1 confere se os campos existem e são coerentes. Ele não sabe se o texto da fonte diz mesmo aquilo.
- O hook 2 analisa o texto do comando. Ele evita acidentes, mas não substitui as permissões do Claude Code: um script que apague arquivos por dentro não é detectado.
- O Claude Code interrompe o ciclo do hook 3 depois de 8 bloqueios seguidos.

### Como desativar temporariamente

- **Todos, numa execução:** `claude --settings '{"disableAllHooks": true}'`
- **Todos, nesta cópia:** crie `.claude/settings.local.json` (fora do Git) com `{ "disableAllHooks": true }`. Apague a linha para reativar.
- **Um só:** remova a entrada dele em `.claude/settings.json` e depois desfaça a mudança. Não há chave para desligar um hook isolado.

O comando `/hooks` mostra o que está ativo.

## Monitor de fontes

O monitor lê 8 endereços oficiais, compara com o que já viu e, se algo mudou, prepara um rascunho em `monitor/`. **Ele não publica nada:** o site só lê `content/`, e o monitor só escreve em `monitor/`. O feed muda quando uma pessoa confere a fonte e escreve o item em `content/novidades/`.

| Arquivo | O que é |
|---|---|
| `tools/monitor/alvos.ts` | Endereços lidos e fontes que ficam para conferência à mão |
| `monitor/estado.json` | O que o monitor já viu |
| `monitor/rascunhos/` | Mudanças detectadas, para revisão |
| `.github/workflows/monitor.yml` | Execução diária e Pull Request de rascunho |
| `.github/workflows/ci.yml` | Conferência de todo Pull Request |

### Publicar uma novidade

1. Leia a mudança na fonte oficial, pelo link do rascunho.
2. Crie `content/novidades/AAAA-MM-DD-slug.json`, usando um item existente como modelo.
3. Rode `npm run validar:conteudo` e `npm test`.
4. Abra um Pull Request e peça revisão.

### Para ligar no GitHub

1. Em Settings, Actions, General: permita que o GitHub Actions crie Pull Requests.
2. Em Settings, Rules: proteja o ramo `main`, com ao menos uma aprovação e o CI obrigatório.
3. Em um Pull Request do monitor, clique em "Approve workflows to run" para o CI rodar.

**Situação em 25/11/2026:** o `www.gov.br` derruba a conexão vinda dos servidores do GitHub (6 das 8 fontes). O bloqueio não é contornado: o agendamento no GitHub está desligado, e uma tarefa diária do Windows ("ECF Descomplicada - monitor de fontes") roda `tools/monitor-local.ts`. Ela grava `monitor/execucao.log` e abre o relatório quando há rascunho novo. Para parar, desative a tarefa no Agendador.

## Publicação

Variáveis de ambiente do build, todas opcionais:

| Variável | Para que serve |
|---|---|
| `SITE_URL` | Domínio próprio, com https. Sem ela, vale o domínio de produção da Vercel |
| `OCULTAR_DE_BUSCADORES` | Com qualquer valor, o site fica no ar com `noindex`. Apague a variável e publique de novo para liberar |
| `SECURITY_CONTACT` | Contato do `security.txt`: `mailto:` ou `https://`. Sem ela, o arquivo não é publicado |

### Passo a passo

1. Crie o repositório no GitHub e envie o código.
2. No GitHub: Settings → Code security → ligue **Private vulnerability reporting**. Siga também "Para ligar no GitHub", acima.
3. Na Vercel: importe o repositório. O `vercel.json` já define o comando e a pasta; não escolha framework.
4. Na Vercel: Settings → Environment Variables → `SECURITY_CONTACT` com `https://github.com/<usuário>/<repositório>/security/advisories/new`.
5. Abra a prévia e confira os cabeçalhos, o 404 e o 405 antes de promover a produção.

Só o build de produção é oferecido a buscadores, e nem ele com `OCULTAR_DE_BUSCADORES`. Build local e prévia saem com `noindex`.
