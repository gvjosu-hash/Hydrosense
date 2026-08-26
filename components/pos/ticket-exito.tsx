"use client";

import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export interface VentaConfirmada {
  id: string;
  total: number;
  montoRecibido: number | null;
  cambio: number | null;
  items: {
    nombre: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
  }[];
}

export function TicketExito({ venta, onNuevaVenta }: { venta: VentaConfirmada; onNuevaVenta: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <Xolo pose="contento" className="w-20 h-20 text-ok" />
      <h1 className="text-2xl font-bold">¡Venta realizada!</h1>

      <Tarjeta className="w-full max-w-sm p-5 text-left">
        <div className="flex flex-col gap-1 mb-3">
          {venta.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.nombre} · {item.cantidad} {ETIQUETA_UNIDAD[item.unidad] ?? item.unidad}
              </span>
              <span>${item.importe.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-borde pt-3 flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>${venta.total.toFixed(2)}</span>
        </div>
        {venta.montoRecibido !== null && (
          <>
            <div className="flex justify-between text-texto-suave mt-1">
              <span>Recibido</span>
              <span>${venta.montoRecibido.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-texto-suave">
              <span>Cambio</span>
              <span>${(venta.cambio ?? 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </Tarjeta>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <a href={`/api/ventas/${venta.id}/ticket`} target="_blank" rel="noopener noreferrer" className="w-full">
          <Boton variante="secundario" tamano="grande" className="w-full">
            Descargar ticket (PDF)
          </Boton>
        </a>
        <Boton tamano="grande" className="w-full" onClick={onNuevaVenta}>
          Nueva venta
        </Boton>
      </div>
    </div>
  );
}
