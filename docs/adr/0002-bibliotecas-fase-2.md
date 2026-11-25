# ADR 0002: bibliotecas da fase 2

- Data: 24/11/2026
- Consulta: servidor MCP do Context7 (`https://mcp.context7.com/mcp`), chamado diretamente pelo protocolo, porque não carregou como ferramenta na sessão. Consultas feitas antes da instalação.

| Biblioteca | Versão | ID no Context7 | O que foi confirmado |
|---|---|---|---|
| Next.js | 16.4.6 | /vercel/next.js | `output: 'export'`; sem headers/redirects; TypeScript 7 aceito por padrão via CLI; SRI não cobre scripts inline |
| Tailwind CSS | 4.3.5 | /tailwindlabs/tailwindcss.com | `@tailwindcss/postcss`, `@custom-variant dark` por atributo, `@theme` |
| shadcn/ui | padrão de código | /shadcn-ui/ui | Componentes próprios com cva. Sem CLI e sem o pacote `cn`: helper local com clsx + tailwind-merge |
| Motion | 14.14.0 | /websites/motion_dev | `LazyMotion`, `motion/react-m`, `MotionConfig reducedMotion="user"` |
| Zod | 4.6.7 | /colinhacks/zod/v4.6.7 | `strictObject`, `discriminatedUnion`, `z.iso.date()` |
| Vitest | 5.1.1 | /vitest-dev/vitest/v5.0.3 | Alias por `import.meta.url`, reporter JSON |
| Playwright | 1.65.1 | /microsoft/playwright/v1.64.1 | `channel: 'chrome'`, `webServer`, `workers` |
| axe-core | 4.14.1 | /dequelabs/axe-core-npm | `AxeBuilder.withTags` |

Consultadas só **depois** da instalação, contrariando a regra (o uso conferiu com a documentação, sem mudanças): lucide-react (/lucide-icons/lucide), class-variance-authority (/joe-bell/cva), tailwind-merge (/dcastil/tailwind-merge) e clsx (/lukeed/clsx).

## Decisões

- CSP: a `<meta>` de cada página tem os hashes dos scripts inline; o `vercel.json` não declara `script-src` nem `default-src`, que bloqueariam esses scripts.
- `public/prefs.js` é externo e síncrono: define tema e nível antes da pintura, sem `dangerouslySetInnerHTML`.
- Menu móvel em `<dialog>` nativo, sem biblioteca de componentes interativos por ora.
- ESLint não entrou nesta fase; a checagem é por TypeScript estrito, testes e guarda de conteúdo.
