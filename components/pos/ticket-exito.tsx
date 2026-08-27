"use client";

import { useState } from "react";
import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
  metodoPago: "EFECTIVO" | "FIADO";
  montoRecibido: number | null;
  cambio: number | null;
  nombreCliente: string | null;
  whatsappCliente: string | null;
  nombreTienda: string;
  items: {
    nombre: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
  }[];
}

export function TicketExito({ venta, onNuevaVenta }: { venta: VentaConfirmada; onNuevaVenta: () => void }) {
  const { mostrar } = useToast();
  const [enviando, setEnviando] = useState(false);

  async function compartirPorWhatsApp() {
    setEnviando(true);
    try {
      const respuesta = await fetch(`/api/ventas/${venta.id}/ticket`);
      const blob = await respuesta.blob();
      const archivo = new File([blob], `ticket-${venta.id}.pdf`, { type: "application/pdf" });
      const mensaje =
        venta.metodoPago === "FIADO" && venta.nombreCliente
          ? `Hola ${venta.nombreCliente}, aquí está tu ticket de ${venta.nombreTienda}. Total fiado: $${venta.total.toFixed(2)}.`
          : `Ticket de ${venta.nombreTienda} · Total: $${venta.total.toFixed(2)}`;

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: venta.nombreTienda, text: mensaje });
        return;
      }

      const numero = venta.metodoPago === "FIADO" ? venta.whatsappCliente : null;
      const enlace = `https://wa.me/${numero ?? ""}?text=${encodeURIComponent(mensaje)}`;
      window.open(enlace, "_blank");
      mostrar("Descarga el PDF y adjúntalo en WhatsApp");
      window.open(`/api/ventas/${venta.id}/ticket`, "_blank");
    } catch {
      mostrar("No se pudo compartir el ticket");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <Xolo className="w-16 h-auto" />
      <h1 className="text-2xl font-bold">
        {venta.metodoPago === "FIADO" ? "¡Fiado registrado!" : "¡Venta realizada!"}
      </h1>

      <Tarjeta className="w-full max-w-sm p-5 text-left">
        {venta.metodoPago === "FIADO" && venta.nombreCliente && (
          <p className="mb-3 pb-3 border-b border-borde text-alerta font-semibold">
            Fiado a: {venta.nombreCliente}
          </p>
        )}
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
        <Boton
          variante="secundario"
          tamano="grande"
          className="w-full"
          onClick={compartirPorWhatsApp}
          disabled={enviando}
        >
          {enviando ? "Enviando..." : "Enviar por WhatsApp"}
        </Boton>
      </div>
      <Boton tamano="grande" className="w-full max-w-sm" onClick={onNuevaVenta}>
        Nueva venta
      </Boton>
    </div>
  );
}
