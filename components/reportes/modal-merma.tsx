"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { Selector } from "@/components/ui/select";

interface ProductoBusqueda {
  id: string;
  nombre: string;
  unidad: "PIEZA" | "KG" | "G" | "L" | "ML";
  stockActual: string;
}

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

const MOTIVOS = [
  { valor: "CADUCIDAD", etiqueta: "Caducidad" },
  { valor: "DANO", etiqueta: "Daño" },
  { valor: "ROBO", etiqueta: "Robo" },
  { valor: "OTRO", etiqueta: "Otro" },
];

export function ModalMerma({ onCerrar, onGuardada }: { onCerrar: () => void; onGuardada: () => void }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [producto, setProducto] = useState<ProductoBusqueda | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("CADUCIDAD");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const buscar = useCallback(async (texto: string) => {
    if (!texto.trim()) {
      setResultados([]);
      return;
    }
    const respuesta = await fetch(`/api/productos?buscar=${encodeURIComponent(texto)}`);
    const datos = await respuesta.json();
    setResultados(datos.productos ?? []);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => buscar(busqueda), 250);
    return () => clearTimeout(temporizador);
  }, [busqueda, buscar]);

  async function guardar() {
    if (!producto) return;
    setGuardando(true);
    setError("");
    try {
      const respuesta = await fetch("/api/mermas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: producto.id, cantidad, motivo, nota }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo registrar la merma");
        return;
      }
      onGuardada();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Registrar merma" onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        {!producto ? (
          <>
            <Campo
              placeholder="Buscar producto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
            />
            {resultados.length > 0 && (
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProducto(p)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl border-2 border-borde-fuerte hover:bg-black/5 cursor-pointer text-left"
                  >
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-texto-suave text-sm">
                      {Number(p.stockActual)} {ETIQUETA_UNIDAD[p.unidad]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-xl border-2 border-acento bg-acento-suave p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{producto.nombre}</p>
                <p className="text-sm text-acento-fuerte">
                  Existencia: {Number(producto.stockActual)} {ETIQUETA_UNIDAD[producto.unidad]}
                </p>
              </div>
              <button
                onClick={() => setProducto(null)}
                className="text-acento font-semibold shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            <Campo
              etiqueta={`Cantidad (${ETIQUETA_UNIDAD[producto.unidad]})`}
              type="number"
              step={producto.unidad === "PIEZA" ? "1" : "0.001"}
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus
            />

            <Selector etiqueta="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {MOTIVOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </Selector>

            <Campo
              etiqueta="Nota (opcional)"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />

            {error && <p className="text-peligro font-medium text-sm">{error}</p>}

            <div className="flex gap-3">
              <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
                Cancelar
              </Boton>
              <Boton
                className="flex-1"
                disabled={guardando || !cantidad || Number(cantidad) <= 0}
                onClick={guardar}
              >
                {guardando ? "Guardando..." : "Registrar"}
              </Boton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
