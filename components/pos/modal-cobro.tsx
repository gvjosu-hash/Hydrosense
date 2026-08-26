"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";
import { TecladoNumerico } from "@/components/pos/teclado-numerico";

export function ModalCobro({
  total,
  onConfirmar,
  onCerrar,
  cobrando,
  error,
}: {
  total: number;
  onConfirmar: (montoRecibido: number) => void;
  onCerrar: () => void;
  cobrando?: boolean;
  error?: string;
}) {
  const [valor, setValor] = useState("");
  const montoRecibido = parseFloat(valor || "0");
  const cambio = montoRecibido - total;
  const alcanza = montoRecibido >= total;

  return (
    <Modal titulo="Cobrar" onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <p className="text-center text-2xl">
          Total a pagar: <span className="font-bold">${total.toFixed(2)}</span>
        </p>

        <div className="text-center">
          <p className="text-texto-suave">Efectivo recibido</p>
          <p className="text-4xl font-bold tabular-nums">${valor || "0"}</p>
        </div>

        <TecladoNumerico valor={valor} onCambiar={setValor} />

        <div
          className={`rounded-xl p-3 text-center text-xl font-bold ${
            alcanza ? "bg-ok-suave text-ok" : "bg-alerta-suave text-alerta"
          }`}
        >
          {alcanza ? `Cambio: $${cambio.toFixed(2)}` : "Falta efectivo"}
        </div>

        {error && <p className="text-peligro font-medium text-center">{error}</p>}

        <div className="flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            className="flex-1"
            disabled={!alcanza || cobrando}
            onClick={() => onConfirmar(montoRecibido)}
          >
            {cobrando ? "Cobrando..." : "Confirmar cobro"}
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
