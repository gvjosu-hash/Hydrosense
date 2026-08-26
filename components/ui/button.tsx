import { ButtonHTMLAttributes, forwardRef } from "react";

type Variante = "primario" | "secundario" | "peligro" | "fantasma";
type Tamano = "normal" | "grande";

const variantes: Record<Variante, string> = {
  primario:
    "bg-acento text-white hover:bg-acento-fuerte active:bg-acento-fuerte disabled:bg-borde-fuerte",
  secundario:
    "bg-superficie text-texto border-2 border-borde-fuerte hover:border-texto disabled:opacity-50",
  peligro:
    "bg-peligro text-white hover:opacity-90 disabled:bg-borde-fuerte",
  fantasma:
    "bg-transparent text-texto hover:bg-black/5 disabled:opacity-50",
};

const tamanos: Record<Tamano, string> = {
  normal: "text-base px-4 py-3 min-h-12",
  grande: "text-xl px-6 py-4 min-h-16",
};

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
}

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(
  ({ variante = "primario", tamano = "normal", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer ${variantes[variante]} ${tamanos[tamano]} ${className}`}
        {...props}
      />
    );
  }
);
Boton.displayName = "Boton";
