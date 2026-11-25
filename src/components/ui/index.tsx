import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Componentes base no padrão shadcn/ui: código próprio, variantes por cva. */
export const estiloBotao = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2 font-semibold no-underline transition-colors",
  {
    variants: {
      variante: {
        primario: "bg-marca text-sobre-marca hover:opacity-90",
        realce: "bg-realce text-sobre-realce hover:opacity-90",
        contorno: "border border-controle bg-superficie text-tinta hover:bg-fundo",
      },
    },
    defaultVariants: { variante: "primario" },
  },
);

export function Botao({
  variante,
  className,
  type = "button",
  ...p
}: ComponentProps<"button"> & VariantProps<typeof estiloBotao>) {
  return <button type={type} className={cn(estiloBotao({ variante }), className)} {...p} />;
}

export function Cartao({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-linha bg-superficie p-6", className)} {...p} />;
}

const estiloEtiqueta = cva("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-medium", {
  variants: {
    tom: {
      neutro: "border border-linha bg-fundo text-suave",
      ok: "bg-ok-fundo text-ok",
      alerta: "bg-alerta-fundo text-alerta",
    },
  },
  defaultVariants: { tom: "neutro" },
});

export function Etiqueta({ tom, className, ...p }: ComponentProps<"span"> & VariantProps<typeof estiloEtiqueta>) {
  return <span className={cn(estiloEtiqueta({ tom }), className)} {...p} />;
}

/** Tabela larga: rola dentro da própria caixa, com foco por teclado e aviso em telas estreitas. */
export function CaixaRolavel({ rotulo, className, ...p }: ComponentProps<"div"> & { rotulo: string }) {
  return (
    <div>
      <p aria-hidden className="mb-2 text-sm text-suave md:hidden">
        Arraste a tabela para o lado →
      </p>
      <div
        role="region"
        aria-label={rotulo}
        tabIndex={0}
        className={cn("relative overflow-x-auto rounded-xl border border-linha bg-superficie", className)}
        {...p}
      />
    </div>
  );
}
export function Nivel({ so, children }: { so: "iniciante" | "profissional"; children: React.ReactNode }) {
  return <div data-so={so}>{children}</div>;
}
