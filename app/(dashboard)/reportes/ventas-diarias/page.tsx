"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { RangoFechas } from "@/components/reportes/rango-fechas";

interface DiaVentas {
  fecha: string;
  numeroVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalFiado: number;
  total: number;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function haceDiasISO(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatoFechaCorta(fechaISO: string): string {
  return new Date(`${fechaISO}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function PaginaVentasDiarias() {
  const router = useRouter();
  const [dias, setDias] = useState<DiaVentas[]>([]);
  const [desde, setDesde] = useState(haceDiasISO(13));
  const [hasta, setHasta] = useState(hoyISO());
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({
      desde: new Date(desde).toISOString(),
      hasta: `${hasta}T23:59:59.999Z`,
    });
    const respuesta = await fetch(`/api/reportes/ventas-diarias?${params.toString()}`);
    const datos = await respuesta.json();
    setDias(datos.dias ?? []);
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    const temporizador = setTimeout(() => cargar(), 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const totalPeriodo = dias.reduce((suma, d) => suma + d.total, 0);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Reportes
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Ventas diarias</h1>
        <Insignia tono="neutral">Total: ${totalPeriodo.toFixed(2)}</Insignia>
      </div>

      <RangoFechas desde={desde} hasta={hasta} onCambiarDesde={setDesde} onCambiarHasta={setHasta} />

      {!cargando && dias.length === 0 && (
        <EstadoVacio titulo="No hay ventas en este rango" descripcion="Ajusta las fechas para ver más." />
      )}

      <div className="flex flex-col gap-2">
        {dias.map((d) => (
          <Tarjeta key={d.fecha} className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold capitalize">{formatoFechaCorta(d.fecha)}</p>
              <p className="text-texto-suave text-sm">
                {d.numeroVentas} venta{d.numeroVentas === 1 ? "" : "s"}
                {d.totalTarjeta > 0 ? ` · $${d.totalTarjeta.toFixed(2)} tarjeta` : ""}
                {d.totalFiado > 0 ? ` · $${d.totalFiado.toFixed(2)} fiado` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">${d.total.toFixed(2)}</p>
              <p className="text-texto-suave text-sm">Efectivo ${d.totalEfectivo.toFixed(2)}</p>
            </div>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
