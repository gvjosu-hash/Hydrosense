"use client";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function TecladoNumerico({
  valor,
  onCambiar,
}: {
  valor: string;
  onCambiar: (nuevoValor: string) => void;
}) {
  function presionar(tecla: string) {
    if (tecla === "⌫") {
      onCambiar(valor.slice(0, -1));
      return;
    }
    if (tecla === "." && valor.includes(".")) return;
    if (valor.replace(".", "").length >= 6) return;
    onCambiar(valor === "0" && tecla !== "." ? tecla : valor + tecla);
  }

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
