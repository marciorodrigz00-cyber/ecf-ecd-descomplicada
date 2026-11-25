"use client";

import { Check } from "lucide-react";
import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";
import { Botao } from "@/components/ui";
import { salvar, usePreferencias } from "@/lib/preferencias";
import { alternarEstudada } from "@/lib/preferencias/modelo";
import { SECOES } from "@/lib/rotas";

const recursos = () => import("motion/react").then((r) => r.domAnimation);

export function BarraProgresso() {
  const { estudadas } = usePreferencias();
  const total = SECOES.length;
  const feitas = SECOES.filter((s) => estudadas.includes(s.slug)).length;
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={recursos} strict>
        <p id="rotulo-progresso" className="font-semibold">
          Seu progresso: {feitas} de {total} seções estudadas
        </p>
        <div
          role="progressbar"
          aria-labelledby="rotulo-progresso"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={feitas}
          className="mt-3 h-3 overflow-hidden rounded-full border border-controle bg-fundo"
        >
          <m.div
            className="h-full w-full origin-left bg-marca"
            initial={false}
            animate={{ scaleX: feitas / total }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-2 text-sm text-suave">O progresso fica salvo só neste navegador.</p>
      </LazyMotion>
    </MotionConfig>
  );
}

export function MarcarEstudada({ slug }: { slug: string }) {
  const { estudadas } = usePreferencias();
  const feita = estudadas.includes(slug);
  return (
    <Botao
      variante={feita ? "contorno" : "primario"}
      aria-pressed={feita}
      onClick={() => salvar({ estudadas: alternarEstudada(estudadas, slug) })}
    >
      {feita && <Check aria-hidden size={18} />}
      {feita ? "Seção estudada" : "Marcar como estudada"}
    </Botao>
  );
}
