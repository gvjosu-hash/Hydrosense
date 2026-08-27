import { HTMLAttributes } from "react";

export function Tarjeta({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-superficie border border-borde rounded-2xl shadow-[var(--sombra-tarjeta)] ${className}`}
      {...props}
    />
  );
}
