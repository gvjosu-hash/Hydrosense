"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { RangoFechas } from "@/components/reportes/rango-fechas";

interface Venta {
  id: string;
  fecha: string;
  total: string;
  metodoPago: "EFECTIVO" | "TARJETA" | "FIADO";
  tipoTarjeta: "CREDITO" | "DEBITO" | null;
  numeroAutorizacion: string | null;
  usuario: { nombre: string };
  cliente: { nombre: string } | null;
  items: { producto: { nombre: string }; cantidad: string }[];
}

const ETIQUETA_METODO: Record<Venta["metodoPago"], string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  FIADO: "Fiado",
};

const TONO_METODO: Record<Venta["metodoPago"], "ok" | "neutral" | "alerta"> = {
  EFECTIVO: "ok",
  TARJETA: "neutral",
  FIADO: "alerta",
};

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function haceDiasISO(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function PaginaRegistroVentas() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [desde, setDesde] = useState(haceDiasISO(6));
  const [hasta, setHasta] = useState(hoyISO());
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({
      desde: new Date(desde).toISOString(),
      hasta: `${hasta}T23:59:59.999Z`,
    });
    const respuesta = await fetch(`/api/ventas?${params.toString()}`);
    const datos = await respuesta.json();
    setVentas(datos.ventas ?? []);
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    const temporizador = setTimeout(() => cargar(), 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const total = ventas.reduce((suma, v) => suma + Number(v.total), 0);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Reportes
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Registro de ventas</h1>
        <Insignia tono="neutral">{ventas.length} ventas · ${total.toFixed(2)}</Insignia>
      </div>

      <RangoFechas desde={desde} hasta={hasta} onCambiarDesde={setDesde} onCambiarHasta={setHasta} />

      {!cargando && ventas.length === 0 && (
        <EstadoVacio titulo="No hay ventas en este rango" descripcion="Ajusta las fechas para ver más." />
      )}

      <div className="flex flex-col gap-2">
        {ventas.map((venta) => (
          <Tarjeta key={venta.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {venta.items.map((i) => i.producto.nombre).join(", ")}
              </p>
              <p className="text-texto-suave text-sm">
                {new Date(venta.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                {" · Atendió "}
                {venta.usuario.nombre}
                {venta.metodoPago === "FIADO" && venta.cliente ? ` · Fiado a ${venta.cliente.nombre}` : ""}
                {venta.metodoPago === "TARJETA"
                  ? ` · ${venta.tipoTarjeta === "CREDITO" ? "Crédito" : "Débito"} · Aut. ${venta.numeroAutorizacion}`
                  : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg">${Number(venta.total).toFixed(2)}</p>
              <Insignia tono={TONO_METODO[venta.metodoPago]}>{ETIQUETA_METODO[venta.metodoPago]}</Insignia>
            </div>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
