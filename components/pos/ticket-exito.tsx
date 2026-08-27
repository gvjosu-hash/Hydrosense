"use client";

import { useState } from "react";
import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
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

type EstadoEnvio = "preguntando" | "pidiendoNumero" | "descartado" | "enviado";

function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function TicketExito({ venta, onNuevaVenta }: { venta: VentaConfirmada; onNuevaVenta: () => void }) {
  const { mostrar } = useToast();
  const [estado, setEstado] = useState<EstadoEnvio>("preguntando");
  const [numero, setNumero] = useState(venta.whatsappCliente ?? "");

  function enviarPorWhatsApp(numeroDestino: string) {
    const enlaceTicket = `${window.location.origin}/api/tickets/${venta.id}`;
    const mensaje =
      venta.metodoPago === "FIADO" && venta.nombreCliente
        ? `Hola ${venta.nombreCliente}, aquí está tu ticket de ${venta.nombreTienda} (fiado, total $${venta.total.toFixed(2)}): ${enlaceTicket}`
        : `Gracias por tu compra en ${venta.nombreTienda}. Aquí está tu ticket: ${enlaceTicket}`;
    window.open(`https://wa.me/${soloDigitos(numeroDestino)}?text=${encodeURIComponent(mensaje)}`, "_blank");
    setEstado("enviado");
  }

  function confirmarEnvio() {
    if (venta.whatsappCliente) {
      enviarPorWhatsApp(venta.whatsappCliente);
    } else {
      setEstado("pidiendoNumero");
    }
  }

  function enviarConNumeroCapturado() {
    const digitos = soloDigitos(numero);
    if (digitos.length < 10) {
      mostrar("Escribe un número de WhatsApp válido (10 dígitos)");
      return;
    }
    enviarPorWhatsApp(digitos);
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

      <Tarjeta className="w-full max-w-sm p-4">
        {estado === "preguntando" && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">
              {venta.whatsappCliente
                ? `¿Enviar el ticket por WhatsApp a ${venta.nombreCliente}?`
                : "¿El cliente quiere su ticket por WhatsApp?"}
            </p>
            <div className="flex gap-3">
              <Boton
                variante="secundario"
                className="flex-1"
                onClick={() => setEstado("descartado")}
              >
                No
              </Boton>
              <Boton className="flex-1" onClick={confirmarEnvio}>
                Sí
              </Boton>
            </div>
          </div>
        )}

        {estado === "pidiendoNumero" && (
          <div className="flex flex-col gap-3">
            <Campo
              etiqueta="Número de WhatsApp del cliente"
              placeholder="55 1234 5678"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <Boton
                variante="secundario"
                className="flex-1"
                onClick={() => setEstado("descartado")}
              >
                Cancelar
              </Boton>
              <Boton className="flex-1" onClick={enviarConNumeroCapturado}>
                Enviar
              </Boton>
            </div>
          </div>
        )}

        {estado === "descartado" && (
          <p className="text-texto-suave text-sm">
            No se envió. La venta ya quedó guardada en el registro de ventas.
          </p>
        )}

        {estado === "enviado" && (
          <p className="text-ok font-semibold text-sm">Se abrió WhatsApp con el ticket listo para enviar.</p>
        )}
      </Tarjeta>

      <div className="w-full max-w-sm">
        <a href={`/api/ventas/${venta.id}/ticket`} target="_blank" rel="noopener noreferrer" className="w-full">
          <Boton variante="secundario" tamano="grande" className="w-full">
            Descargar ticket (PDF)
          </Boton>
        </a>
      </div>
      <Boton tamano="grande" className="w-full max-w-sm" onClick={onNuevaVenta}>
        Nueva venta
      </Boton>
    </div>
  );
}
