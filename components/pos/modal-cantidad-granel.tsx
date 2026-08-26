"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";
import { TecladoNumerico } from "@/components/pos/teclado-numerico";

const ETIQUETA_UNIDAD: Record<string, string> = { KG: "kg", G: "g", L: "l", ML: "ml" };

export function ModalCantidadGranel({
  nombre,
  unidad,
  precio,
  cantidadInicial,
  onConfirmar,
  onCerrar,
}: {
  nombre: string;
  unidad: string;
  precio: number;
  cantidadInicial?: string;
  onConfirmar: (cantidad: number) => void;
  onCerrar: () => void;
}) {
  const [valor, setValor] = useState(cantidadInicial ?? "");
  const cantidad = parseFloat(valor || "0");
  const importe = cantidad * precio;

  return (
    <Modal titulo={nombre} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-texto-suave">Cantidad ({ETIQUETA_UNIDAD[unidad] ?? unidad})</p>
          <p className="text-4xl font-bold tabular-nums">{valor || "0"}</p>
          <p className="text-lg text-texto-suave mt-1">
            ${precio.toFixed(2)} / {ETIQUETA_UNIDAD[unidad] ?? unidad} · Importe: ${importe.toFixed(2)}
          </p>
        </div>
        <TecladoNumerico valor={valor} onCambiar={setValor} />
        <div className="flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            className="flex-1"
            disabled={cantidad <= 0}
            onClick={() => onConfirmar(cantidad)}
          >
            Agregar
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
