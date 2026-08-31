"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";

interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  totalFilas: number;
  errores: { fila: number; mensaje: string }[];
}

export function ModalImportarProductos({
  onCerrar,
  onImportado,
}: {
  onCerrar: () => void;
  onImportado: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  async function importar() {
    if (!archivo) {
      setError("Selecciona un archivo .csv o .xlsx");
      return;
    }
    setCargando(true);
    setError("");
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const respuesta = await fetch("/api/productos/importar", { method: "POST", body: formData });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo importar el archivo");
        return;
      }
      setResultado(datos);
      onImportado();
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal titulo="Importar productos" onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <p className="text-texto-suave text-sm">
          Sube un archivo .csv o .xlsx con tu catálogo. Si un producto ya existe (mismo código de
          barras), se actualiza; si no, se crea.
        </p>

        <a
          href={["/api/productos/importar", "plantilla"].join("/")}
          className="text-sm font-semibold text-acento self-start"
        >
          Descargar plantilla de ejemplo
        </a>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            setArchivo(e.target.files?.[0] ?? null);
            setResultado(null);
            setError("");
          }}
          className="text-sm"
        />

        {error && <p className="text-peligro text-sm font-semibold">{error}</p>}

        {resultado && (
          <div className="bg-fondo rounded-xl p-3 flex flex-col gap-1 text-sm">
            <p className="font-semibold">
              {resultado.creados} creados · {resultado.actualizados} actualizados
              {resultado.errores.length > 0 ? ` · ${resultado.errores.length} con error` : ""}
            </p>
            {resultado.errores.length > 0 && (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1 mt-1">
                {resultado.errores.map((e, i) => (
                  <p key={i} className="text-peligro">
                    Fila {e.fila}: {e.mensaje}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
          <Boton onClick={importar} disabled={cargando || !archivo}>
            {cargando ? "Importando…" : "Importar"}
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
