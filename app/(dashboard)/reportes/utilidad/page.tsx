"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { RangoFechas } from "@/components/reportes/rango-fechas";

interface Fila {
  nombre: string;
  categoria: string;
  cantidad: number;
  ingreso: number;
  costoTotal: number;
  utilidad: number;
  costoDesconocido: boolean;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function haceDiasISO(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function PaginaUtilidad() {
  const router = useRouter();
  const [productos, setProductos] = useState<Fila[]>([]);
  const [categorias, setCategorias] = useState<Fila[]>([]);
  const [agruparPorCategoria, setAgruparPorCategoria] = useState(false);
  const [desde, setDesde] = useState(haceDiasISO(29));
  const [hasta, setHasta] = useState(hoyISO());
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({
      desde: new Date(desde).toISOString(),
      hasta: `${hasta}T23:59:59.999Z`,
    });
    const respuesta = await fetch(`/api/reportes/utilidad?${params.toString()}`);
    const datos = await respuesta.json();
    setProductos(datos.productos ?? []);
    setCategorias(datos.categorias ?? []);
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => {
    const temporizador = setTimeout(() => cargar(), 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const filas = agruparPorCategoria ? categorias : productos;
  const ingresoTotal = filas.reduce((s, f) => s + f.ingreso, 0);
  const utilidadTotal = filas.reduce((s, f) => s + f.utilidad, 0);
  const hayCostoDesconocido = filas.some((f) => f.costoDesconocido);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Reportes
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Utilidad bruta</h1>
        <Insignia tono="ok">Utilidad: ${utilidadTotal.toFixed(2)}</Insignia>
      </div>
      <p className="text-texto-suave text-sm">Ingreso total: ${ingresoTotal.toFixed(2)}</p>
      {hayCostoDesconocido && (
        <p className="text-sm text-texto-suave">
          Algunos productos no tienen costo registrado; su utilidad puede estar subestimada. Agrega el
          costo desde Productos para un cálculo exacto.
        </p>
      )}

      <RangoFechas desde={desde} hasta={hasta} onCambiarDesde={setDesde} onCambiarHasta={setHasta} />

      <button
        onClick={() => setAgruparPorCategoria((v) => !v)}
        className={`self-start px-4 py-2 min-h-10 rounded-xl border-2 font-semibold cursor-pointer ${
          agruparPorCategoria
            ? "border-acento bg-acento-suave text-acento-fuerte"
            : "border-borde-fuerte text-texto-suave"
        }`}
      >
        {agruparPorCategoria ? "Agrupado por categoría" : "Agrupar por categoría"}
      </button>

      {!cargando && filas.length === 0 && (
        <EstadoVacio titulo="No hay ventas en este rango" descripcion="Ajusta las fechas para ver más." />
      )}

      <div className="flex flex-col gap-2">
        {filas.map((f, i) => (
          <Tarjeta key={`${f.nombre}-${i}`} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{f.nombre}</p>
              <p className="text-texto-suave text-sm">
                {f.cantidad} vendidos · Ingreso ${f.ingreso.toFixed(2)}
                {f.costoDesconocido ? " · costo parcial" : ` · Costo $${f.costoTotal.toFixed(2)}`}
              </p>
            </div>
            <p className={`font-bold text-lg shrink-0 ${f.utilidad >= 0 ? "text-ok" : "text-peligro"}`}>
              ${f.utilidad.toFixed(2)}
            </p>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
