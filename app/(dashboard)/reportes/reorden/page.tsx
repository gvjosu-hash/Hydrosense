"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { BotonesExportar } from "@/components/reportes/botones-exportar";

interface Producto {
  id: string;
  nombre: string;
  unidad: "PIEZA" | "KG" | "G" | "L" | "ML";
  stockActual: string;
  stockMinimo: string;
}

const ETIQUETA_UNIDAD: Record<Producto["unidad"], string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export default function PaginaReorden() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/productos")
      .then((r) => r.json())
      .then((datos) => setProductos(datos.productos ?? []))
      .finally(() => setCargando(false));
  }, []);

  const paraReordenar = productos
    .filter((p) => Number(p.stockActual) <= Number(p.stockMinimo) && Number(p.stockMinimo) > 0)
    .sort((a, b) => {
      const urgenciaA = Number(a.stockActual) - Number(a.stockMinimo);
      const urgenciaB = Number(b.stockActual) - Number(b.stockMinimo);
      return urgenciaA - urgenciaB;
    });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Reportes
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reorden</h1>
        {paraReordenar.length > 0 && (
          <Insignia tono="alerta">{paraReordenar.length} para reordenar</Insignia>
        )}
      </div>
      <p className="text-texto-suave text-sm">
        Productos en o por debajo del mínimo que definiste en Productos (&quot;Alertar cuando baje
        de&quot;).
      </p>

      <BotonesExportar endpoint="/api/reportes/reorden/exportar" />

      {!cargando && paraReordenar.length === 0 && (
        <EstadoVacio
          titulo="Nada que reordenar por ahora"
          descripcion="Cuando un producto llegue a su mínimo, va a aparecer aquí."
        />
      )}

      <div className="flex flex-col gap-2">
        {paraReordenar.map((p) => {
          const stockActual = Number(p.stockActual);
          const stockMinimo = Number(p.stockMinimo);
          const sugerido = Math.max(stockMinimo * 2 - stockActual, stockMinimo);
          const agotado = stockActual <= 0;
          return (
            <Tarjeta
              key={p.id}
              className={`p-4 flex items-center justify-between gap-3 ${agotado ? "border-peligro" : "border-alerta"}`}
            >
              <div>
                <p className="font-semibold">{p.nombre}</p>
                <p className="text-texto-suave text-sm">
                  Existencia: {stockActual} {ETIQUETA_UNIDAD[p.unidad]} · Mínimo: {stockMinimo}{" "}
                  {ETIQUETA_UNIDAD[p.unidad]}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-lg">
                  Pedir ~{sugerido} {ETIQUETA_UNIDAD[p.unidad]}
                </p>
                {agotado && <Insignia tono="peligro">Agotado</Insignia>}
              </div>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
