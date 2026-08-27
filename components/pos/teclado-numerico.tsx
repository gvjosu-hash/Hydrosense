"use client";

import { useCallback, useEffect } from "react";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function TecladoNumerico({
  valor,
  onCambiar,
}: {
  valor: string;
  onCambiar: (nuevoValor: string) => void;
}) {
  const presionar = useCallback(
    (tecla: string) => {
      if (tecla === "⌫") {
        onCambiar(valor.slice(0, -1));
        return;
      }
      if (tecla === "." && valor.includes(".")) return;
      if (valor.replace(".", "").length >= 6) return;
      onCambiar(valor === "0" && tecla !== "." ? tecla : valor + tecla);
    },
    [valor, onCambiar]
  );

  // En computadora es más natural teclear el monto que darle clic a cada
  // botón con el mouse. Mientras este teclado esté montado, el teclado
  // físico hace lo mismo que tocar los botones (si no se está escribiendo
  // en otro campo de texto de la página).
  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      const objetivo = evento.target as HTMLElement | null;
      const escribiendoEnCampo =
        objetivo?.tagName === "INPUT" ||
        objetivo?.tagName === "TEXTAREA" ||
        objetivo?.isContentEditable;
      if (escribiendoEnCampo) return;

      if (evento.key >= "0" && evento.key <= "9") {
        evento.preventDefault();
        presionar(evento.key);
      } else if (evento.key === "." || evento.key === ",") {
        evento.preventDefault();
        presionar(".");
      } else if (evento.key === "Backspace" || evento.key === "Delete") {
        evento.preventDefault();
        presionar("⌫");
      }
    }

    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [presionar]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {TECLAS.map((tecla) => (
        <button
          key={tecla}
          type="button"
          onClick={() => presionar(tecla)}
          className="min-h-16 rounded-xl border-2 border-borde-fuerte bg-superficie text-2xl font-semibold hover:bg-black/5 active:bg-black/10 cursor-pointer"
        >
          {tecla}
        </button>
      ))}
    </div>
  );
}
