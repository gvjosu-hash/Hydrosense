import { ReactNode } from "react";

type Tono = "neutral" | "ok" | "alerta" | "peligro";

const tonos: Record<Tono, string> = {
  neutral: "bg-acento-suave text-acento-fuerte",
  ok: "bg-ok-suave text-ok",
  alerta: "bg-alerta-suave text-alerta",
  peligro: "bg-peligro-suave text-peligro",
};

export function Insignia({ tono = "neutral", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}
