"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/input";
import { Selector } from "@/components/ui/select";
import { Boton } from "@/components/ui/button";

export interface DatosFormularioProducto {
  nombre: string;
  tipoVenta: "PIEZA" | "GRANEL";
  unidad: "PIEZA" | "KG" | "G" | "L" | "ML";
  precio: string;
  stockActual: string;
  stockMinimo: string;
  codigoBarras: string;
}

const UNIDADES_GRANEL = [
  { valor: "KG", etiqueta: "Kilogramo (kg)" },
  { valor: "G", etiqueta: "Gramo (g)" },
  { valor: "L", etiqueta: "Litro (l)" },
  { valor: "ML", etiqueta: "Mililitro (ml)" },
];

export function FormularioProducto({
  valoresIniciales,
  onGuardar,
  onCancelar,
  guardando,
  error,
}: {
  valoresIniciales?: Partial<DatosFormularioProducto>;
  onGuardar: (datos: DatosFormularioProducto) => void;
  onCancelar: () => void;
  guardando?: boolean;
  error?: string;
}) {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [tipoVenta, setTipoVenta] = useState<"PIEZA" | "GRANEL">(
    valoresIniciales?.tipoVenta ?? "PIEZA"
  );
  const [unidad, setUnidad] = useState<DatosFormularioProducto["unidad"]>(
    valoresIniciales?.unidad ?? "PIEZA"
  );
  const [precio, setPrecio] = useState(valoresIniciales?.precio ?? "");
  const [stockActual, setStockActual] = useState(valoresIniciales?.stockActual ?? "0");
  const [stockMinimo, setStockMinimo] = useState(valoresIniciales?.stockMinimo ?? "0");
  const [codigoBarras, setCodigoBarras] = useState(valoresIniciales?.codigoBarras ?? "");

  function cambiarTipoVenta(nuevo: "PIEZA" | "GRANEL") {
    setTipoVenta(nuevo);
    setUnidad(nuevo === "PIEZA" ? "PIEZA" : "KG");
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    onGuardar({ nombre, tipoVenta, unidad, precio, stockActual, stockMinimo, codigoBarras });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo
        etiqueta="Nombre del producto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        autoFocus
      />

      <div>
        <span className="text-base font-medium text-texto">Se vende por</span>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <button
            type="button"
            onClick={() => cambiarTipoVenta("PIEZA")}
            className={`min-h-14 rounded-xl border-2 font-semibold text-lg cursor-pointer ${
              tipoVenta === "PIEZA"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Pieza
          </button>
          <button
            type="button"
            onClick={() => cambiarTipoVenta("GRANEL")}
            className={`min-h-14 rounded-xl border-2 font-semibold text-lg cursor-pointer ${
              tipoVenta === "GRANEL"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Granel (peso/volumen)
          </button>
        </div>
      </div>

      {tipoVenta === "GRANEL" && (
        <Selector
          etiqueta="Unidad"
          value={unidad}
          onChange={(e) => setUnidad(e.target.value as DatosFormularioProducto["unidad"])}
        >
          {UNIDADES_GRANEL.map((u) => (
            <option key={u.valor} value={u.valor}>
              {u.etiqueta}
            </option>
          ))}
        </Selector>
      )}

      <Campo
        etiqueta={tipoVenta === "PIEZA" ? "Precio por pieza ($)" : `Precio por ${unidad.toLowerCase()} ($)`}
        type="number"
        step="0.01"
        min="0"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Campo
          etiqueta="Existencia actual"
          type="number"
          step={tipoVenta === "PIEZA" ? "1" : "0.001"}
          min="0"
          value={stockActual}
          onChange={(e) => setStockActual(e.target.value)}
        />
        <Campo
          etiqueta="Alertar cuando baje de"
          type="number"
          step={tipoVenta === "PIEZA" ? "1" : "0.001"}
          min="0"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
        />
      </div>

      <Campo
        etiqueta="Código de barras (opcional)"
        value={codigoBarras}
        onChange={(e) => setCodigoBarras(e.target.value)}
      />

      {error && <p className="text-peligro font-medium">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Boton type="button" variante="secundario" className="flex-1" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" className="flex-1" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Boton>
      </div>
    </form>
  );
}
