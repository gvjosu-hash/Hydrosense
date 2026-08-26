"use client";

import { useEffect, useMemo, useState } from "react";
import { Campo } from "@/components/ui/input";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";

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

export default function PaginaInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/productos")
      .then((r) => r.json())
      .then((datos) => setProductos(datos.productos ?? []))
      .finally(() => setCargando(false));
  }, []);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const coincideTexto = !texto || p.nombre.toLowerCase().includes(texto);
      const bajoMinimo = Number(p.stockActual) < Number(p.stockMinimo);
      return coincideTexto && (!soloStockBajo || bajoMinimo);
    });
  }, [productos, busqueda, soloStockBajo]);

  const cantidadStockBajo = productos.filter(
    (p) => Number(p.stockActual) < Number(p.stockMinimo)
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventario</h1>
        {cantidadStockBajo > 0 && (
          <Insignia tono="alerta">{cantidadStockBajo} con stock bajo</Insignia>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Campo
            placeholder="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button
          onClick={() => setSoloStockBajo((v) => !v)}
          className={`px-4 py-3 min-h-12 rounded-xl border-2 font-semibold whitespace-nowrap cursor-pointer ${
            soloStockBajo
              ? "border-alerta bg-alerta-suave text-alerta"
              : "border-borde-fuerte text-texto-suave"
          }`}
        >
          Solo stock bajo
        </button>
      </div>

      {!cargando && productosFiltrados.length === 0 && (
        <EstadoVacio
          titulo="No hay productos que mostrar"
          descripcion="Ajusta la búsqueda o el filtro de stock bajo."
        />
      )}

      <div className="flex flex-col gap-2">
        {productosFiltrados.map((producto) => {
          const bajoMinimo = Number(producto.stockActual) < Number(producto.stockMinimo);
          return (
            <Tarjeta
              key={producto.id}
              className={`p-4 flex items-center justify-between gap-3 ${
                bajoMinimo ? "border-alerta" : ""
              }`}
            >
              <div>
                <p className="font-semibold text-lg">{producto.nombre}</p>
                <p className="text-texto-suave text-sm">
                  Mínimo: {Number(producto.stockMinimo)} {ETIQUETA_UNIDAD[producto.unidad]}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${bajoMinimo ? "text-alerta" : ""}`}>
                  {Number(producto.stockActual)} {ETIQUETA_UNIDAD[producto.unidad]}
                </p>
                {bajoMinimo && <Insignia tono="alerta">Stock bajo</Insignia>}
              </div>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
