"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { TecladoNumerico } from "@/components/pos/teclado-numerico";

export type ResultadoAbono =
  | { metodoPago: "EFECTIVO"; monto: number }
  | {
      metodoPago: "TARJETA";
      monto: number;
      tipoTarjeta: "CREDITO" | "DEBITO";
      numeroAutorizacion: string;
    };

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
  onConfirmar: (resultado: ResultadoAbono) => void;
  onCerrar: () => void;
  guardando?: boolean;
  error?: string;
}) {
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TARJETA">("EFECTIVO");
  const [valor, setValor] = useState("");
  const monto = parseFloat(valor || "0");
  const excedeSaldo = monto > saldoPendiente;

  const [tipoTarjeta, setTipoTarjeta] = useState<"CREDITO" | "DEBITO">("CREDITO");
  const [numeroAutorizacion, setNumeroAutorizacion] = useState("");

  function confirmar() {
    if (metodo === "EFECTIVO") {
      onConfirmar({ metodoPago: "EFECTIVO", monto });
    } else {
      onConfirmar({
        metodoPago: "TARJETA",
        monto,
        tipoTarjeta,
        numeroAutorizacion: numeroAutorizacion.trim(),
      });
    }
  }

  const puedeConfirmar =
    monto > 0 &&
    !excedeSaldo &&
    (metodo === "EFECTIVO" || numeroAutorizacion.trim().length > 0);

  return (
    <Modal titulo={`Abono de ${nombreCliente}`} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <p className="text-center text-texto-suave">
          Debe ${saldoPendiente.toFixed(2)}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMetodo("EFECTIVO")}
            className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
              metodo === "EFECTIVO"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Efectivo
          </button>
          <button
            type="button"
            onClick={() => setMetodo("TARJETA")}
            className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
              metodo === "TARJETA"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Tarjeta
          </button>
        </div>

        <div className="text-center">
          <p className="text-texto-suave">Monto del abono</p>
          <p className="text-4xl font-bold tabular-nums">${valor || "0"}</p>
        </div>

        <TecladoNumerico valor={valor} onCambiar={setValor} />

        {excedeSaldo && (
          <p className="text-peligro font-medium text-center text-sm">
            El abono no puede ser mayor a lo que debe (${saldoPendiente.toFixed(2)})
          </p>
        )}

        {metodo === "TARJETA" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoTarjeta("CREDITO")}
                className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
                  tipoTarjeta === "CREDITO"
                    ? "border-acento bg-acento-suave text-acento-fuerte"
                    : "border-borde-fuerte text-texto-suave"
                }`}
              >
                Crédito
              </button>
              <button
                type="button"
                onClick={() => setTipoTarjeta("DEBITO")}
                className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
                  tipoTarjeta === "DEBITO"
                    ? "border-acento bg-acento-suave text-acento-fuerte"
                    : "border-borde-fuerte text-texto-suave"
                }`}
              >
                Débito
              </button>
            </div>
            <Campo
              etiqueta="Número de autorización"
              placeholder="Del voucher que imprime la terminal"
              value={numeroAutorizacion}
              onChange={(e) => setNumeroAutorizacion(e.target.value)}
            />
          </>
        )}

        {error && <p className="text-peligro font-medium text-center">{error}</p>}

        <div className="flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton className="flex-1" disabled={!puedeConfirmar || guardando} onClick={confirmar}>
            {guardando ? "Guardando..." : "Registrar abono"}
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
