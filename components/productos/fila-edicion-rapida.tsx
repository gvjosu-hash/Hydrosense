"use client";

import { useEffect, useRef, useState } from "react";
import { Tarjeta } from "@/components/ui/card";

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

type Cambios = {
  precio?: string;
  costo?: string;
  categoria?: string;
  fechaCaducidad?: string;
  stockActual?: string;
  stockMinimo?: string;
};

export function FilaEdicionRapida({
  id,
  nombre,
  unidad,
  precioInicial,
  costoInicial,
  categoriaInicial,
  fechaCaducidadInicial,
  stockInicial,
  stockMinimoInicial,
  onCerrar,
}: {
  id: string;
  nombre: string;
  unidad: string;
  precioInicial: string;
  costoInicial: string;
  categoriaInicial: string;
  fechaCaducidadInicial: string;
  stockInicial: string;
  stockMinimoInicial: string;
  onCerrar: () => void;
}) {
  const [precio, setPrecio] = useState(precioInicial);
  const [costo, setCosto] = useState(costoInicial);
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [fechaCaducidad, setFechaCaducidad] = useState(fechaCaducidadInicial);
  const [stock, setStock] = useState(stockInicial);
  const [stockMinimo, setStockMinimo] = useState(stockMinimoInicial);
  const [estado, setEstado] = useState<"reposo" | "guardando" | "guardado">("reposo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Acumula cambios entre disparos del temporizador: si el usuario edita
  // varios campos seguido, uno no debe borrar el pendiente del otro — se
  // mandan juntos cuando finalmente se guarda.
  const pendientes = useRef<Cambios>({});

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function programarGuardado(cambios: Cambios) {
    pendientes.current = { ...pendientes.current, ...cambios };
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      const aEnviar = pendientes.current;
      pendientes.current = {};
      setEstado("guardando");
      try {
        await fetch(`/api/productos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aEnviar),
        });
        setEstado("guardado");
        setTimeout(() => setEstado((actual) => (actual === "guardado" ? "reposo" : actual)), 1200);
      } catch {
        setEstado("reposo");
      }
    }, 600);
  }

  const pasoStock = unidad === "PIEZA" ? "1" : "0.001";

  return (
    <Tarjeta className="p-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 border-acento border-2">
      <div className="flex items-center justify-between sm:flex-1 sm:min-w-0 gap-2">
        <p className="font-semibold truncate">{nombre}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-ok text-lg" aria-hidden>
            {estado === "guardando" ? "…" : estado === "guardado" ? "✓" : ""}
          </span>
          <button
            onClick={onCerrar}
            className="text-acento font-semibold text-sm px-2 py-1 cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-texto-suave">Precio $</span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              programarGuardado({ precio: e.target.value });
            }}
            className="w-full sm:w-24 text-lg px-2 py-1.5 rounded-lg border-2 border-borde-fuerte text-center focus:outline-none focus:border-acento"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-texto-suave">
            Existencia ({ETIQUETA_UNIDAD[unidad] ?? unidad})
          </span>
          <input
            type="number"
            step={pasoStock}
            min="0"
            inputMode="decimal"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              programarGuardado({ stockActual: e.target.value });
            }}
            className="w-full sm:w-24 text-lg px-2 py-1.5 rounded-lg border-2 border-borde-fuerte text-center focus:outline-none focus:border-acento"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-texto-suave">Alertar bajo de</span>
          <input
            type="number"
            step={pasoStock}
            min="0"
            inputMode="decimal"
            value={stockMinimo}
            onChange={(e) => {
              setStockMinimo(e.target.value);
              programarGuardado({ stockMinimo: e.target.value });
            }}
            className="w-full sm:w-24 text-lg px-2 py-1.5 rounded-lg border-2 border-borde-fuerte text-center focus:outline-none focus:border-acento"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-texto-suave">Costo $ (para utilidad)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={costo}
            onChange={(e) => {
              setCosto(e.target.value);
              programarGuardado({ costo: e.target.value });
            }}
            className="w-full sm:w-28 text-lg px-2 py-1.5 rounded-lg border-2 border-borde-fuerte text-center focus:outline-none focus:border-acento"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-texto-suave">Categoría</span>
          <input
            type="text"
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              programarGuardado({ categoria: e.target.value });
            }}
            className="w-full sm:w-32 text-base px-2 py-1.5 rounded-lg border-2 border-borde-fuerte text-center focus:outline-none focus:border-acento"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-texto-suave">Caduca</span>
          <input
            type="date"
            value={fechaCaducidad}
            onChange={(e) => {
              setFechaCaducidad(e.target.value);
              programarGuardado({ fechaCaducidad: e.target.value });
            }}
            className="w-full sm:w-36 text-base px-2 py-1.5 rounded-lg border-2 border-borde-fuerte text-center focus:outline-none focus:border-acento"
          />
        </div>
      </div>
    </Tarjeta>
  );
}
