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

export function FilaEdicionRapida({
  id,
  nombre,
  unidad,
  precioInicial,
  stockInicial,
}: {
  id: string;
  nombre: string;
  unidad: string;
  precioInicial: string;
  stockInicial: string;
}) {
  const [precio, setPrecio] = useState(precioInicial);
  const [stock, setStock] = useState(stockInicial);
  const [estado, setEstado] = useState<"reposo" | "guardando" | "guardado">("reposo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Acumula cambios de precio/existencia entre disparos del temporizador: si
  // el usuario edita los dos campos seguido, el segundo cambio no debe borrar
  // el primero — se mandan juntos cuando finalmente se guarda.
  const pendientes = useRef<{ precio?: string; stockActual?: string }>({});

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function programarGuardado(cambios: { precio?: string; stockActual?: string }) {
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

  return (
    <Tarjeta className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center justify-between sm:flex-1 sm:min-w-0">
        <p className="font-semibold">{nombre}</p>
        <span className="text-ok text-lg sm:hidden" aria-hidden>
          {estado === "guardando" ? "…" : estado === "guardado" ? "✓" : ""}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-0.5 flex-1 sm:flex-none">
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

        <div className="flex flex-col gap-0.5 flex-1 sm:flex-none">
          <span className="text-xs text-texto-suave">
            Existencia ({ETIQUETA_UNIDAD[unidad] ?? unidad})
          </span>
          <input
            type="number"
            step={unidad === "PIEZA" ? "1" : "0.001"}
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

        <span className="hidden sm:block w-5 text-center text-ok text-lg self-end pb-2" aria-hidden>
          {estado === "guardando" ? "…" : estado === "guardado" ? "✓" : ""}
        </span>
      </div>
    </Tarjeta>
  );
}
