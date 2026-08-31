"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Campo } from "@/components/ui/input";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { BotonesExportar } from "@/components/reportes/botones-exportar";

interface Producto {
  id: string;
  nombre: string;
  unidad: "PIEZA" | "KG" | "G" | "L" | "ML";
  categoria: string | null;
  costo: string | null;
  stockActual: string;
}

const ETIQUETA_UNIDAD: Record<Producto["unidad"], string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export default function PaginaReporteExistencias() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/productos")
      .then((r) => r.json())
      .then((datos) => setProductos(datos.productos ?? []))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) => !texto || p.nombre.toLowerCase().includes(texto) || (p.categoria ?? "").toLowerCase().includes(texto)
    );
  }, [productos, busqueda]);

  const valorTotal = filtrados.reduce(
    (suma, p) => suma + Number(p.stockActual) * Number(p.costo ?? 0),
    0
  );
  const conCostoDesconocido = filtrados.some((p) => p.costo === null && Number(p.stockActual) > 0);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Reportes
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Existencias (stock actual)</h1>
        <Insignia tono="neutral">Valor: ${valorTotal.toFixed(2)}</Insignia>
      </div>
      {conCostoDesconocido && (
        <p className="text-sm text-texto-suave">
          Algunos productos no tienen costo registrado; su valor no se incluye en el total.
        </p>
      )}

      <Campo
        placeholder="Buscar por nombre o categoría"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <BotonesExportar endpoint="/api/reportes/existencias/exportar" />

      {!cargando && filtrados.length === 0 && (
        <EstadoVacio titulo="No hay productos que mostrar" descripcion="Ajusta la búsqueda." />
      )}

      <div className="flex flex-col gap-2">
        {filtrados.map((p) => (
          <Tarjeta key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{p.nombre}</p>
              <p className="text-texto-suave text-sm">
                {p.categoria ?? "Sin categoría"}
                {p.costo !== null ? ` · Costo $${Number(p.costo).toFixed(2)}` : " · Sin costo"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg">
                {Number(p.stockActual)} {ETIQUETA_UNIDAD[p.unidad]}
              </p>
              {p.costo !== null && (
                <p className="text-texto-suave text-sm">
                  ${(Number(p.stockActual) * Number(p.costo)).toFixed(2)}
                </p>
              )}
            </div>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
