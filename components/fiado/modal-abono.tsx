"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";
import { TecladoNumerico } from "@/components/pos/teclado-numerico";

export function ModalAbono({
  nombreCliente,
  saldoPendiente,
  onConfirmar,
  onCerrar,
  guardando,
  error,
}: {
  nombreCliente: string;
  saldoPendiente: number;
  onConfirmar: (monto: number) => void;
  onCerrar: () => void;
  guardando?: boolean;
  error?: string;
}) {
  const [valor, setValor] = useState("");
  const monto = parseFloat(valor || "0");

  return (
    <Modal titulo={`Abono de ${nombreCliente}`} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <p className="text-center text-texto-suave">
          Debe ${saldoPendiente.toFixed(2)}
        </p>

        <div className="text-center">
          <p className="text-texto-suave">Monto del abono</p>
          <p className="text-4xl font-bold tabular-nums">${valor || "0"}</p>
        </div>

        <TecladoNumerico valor={valor} onCambiar={setValor} />

        {error && <p className="text-peligro font-medium text-center">{error}</p>}

        <div className="flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            className="flex-1"
            disabled={monto <= 0 || guardando}
            onClick={() => onConfirmar(monto)}
          >
            {guardando ? "Guardando..." : "Registrar abono"}
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
