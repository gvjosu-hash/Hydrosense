"use client";

import { Tarjeta } from "@/components/ui/card";

export interface ItemCarrito {
  productoId: string;
  nombre: string;
  tipoVenta: "PIEZA" | "GRANEL";
  unidad: string;
  precioUnitario: number;
  cantidad: number;
}

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export function Carrito({
  items,
  onCambiarCantidadPieza,
  onEditarGranel,
  onQuitar,
}: {
  items: ItemCarrito[];
  onCambiarCantidadPieza: (productoId: string, nuevaCantidad: number) => void;
  onEditarGranel: (item: ItemCarrito) => void;
  onQuitar: (productoId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-center text-texto-suave py-8">
        Busca un producto arriba para agregarlo a la venta.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Tarjeta key={item.productoId} className="p-3 flex items-center justify-between gap-3">
          <button
            className={`flex-1 text-left ${item.tipoVenta === "GRANEL" ? "cursor-pointer" : ""}`}
            onClick={() => item.tipoVenta === "GRANEL" && onEditarGranel(item)}
          >
            <p className="font-semibold">{item.nombre}</p>
            <p className="text-texto-suave text-sm">
              {item.cantidad} {ETIQUETA_UNIDAD[item.unidad]} × ${item.precioUnitario.toFixed(2)}
            </p>
          </button>

          {item.tipoVenta === "PIEZA" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCambiarCantidadPieza(item.productoId, item.cantidad - 1)}
                className="w-10 h-10 rounded-full border-2 border-borde-fuerte text-xl font-bold cursor-pointer"
                aria-label="Quitar uno"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{item.cantidad}</span>
              <button
                onClick={() => onCambiarCantidadPieza(item.productoId, item.cantidad + 1)}
                className="w-10 h-10 rounded-full border-2 border-borde-fuerte text-xl font-bold cursor-pointer"
                aria-label="Agregar uno"
              >
                +
              </button>
            </div>
          )}

          <p className="font-bold w-20 text-right">
            ${(item.cantidad * item.precioUnitario).toFixed(2)}
          </p>

          <button
            onClick={() => onQuitar(item.productoId)}
            aria-label="Quitar producto"
            className="text-texto-suave hover:text-peligro text-xl px-1 cursor-pointer"
          >
            ×
          </button>
        </Tarjeta>
      ))}
    </div>
  );
}
