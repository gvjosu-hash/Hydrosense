"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { useToast } from "@/components/ui/toast";
import { ModalMerma } from "@/components/reportes/modal-merma";

interface Merma {
  id: string;
  fecha: string;
  cantidad: string;
  motivo: "CADUCIDAD" | "DANO" | "ROBO" | "OTRO";
  nota: string | null;
  producto: { nombre: string; unidad: "PIEZA" | "KG" | "G" | "L" | "ML" };
}

interface ProductoCaducidad {
  id: string;
  nombre: string;
  fechaCaducidad: string;
  stockActual: string;
}

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

const ETIQUETA_MOTIVO: Record<Merma["motivo"], string> = {
  CADUCIDAD: "Caducidad",
  DANO: "Daño",
  ROBO: "Robo",
  OTRO: "Otro",
};

function diasHasta(fechaISO: string): number {
  const ms = new Date(fechaISO).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function PaginaMermas() {
  const router = useRouter();
  const { mostrar } = useToast();
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [productosCaducidad, setProductosCaducidad] = useState<ProductoCaducidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [respMermas, respProductos] = await Promise.all([
      fetch("/api/mermas"),
      fetch("/api/productos"),
    ]);
    const datosMermas = await respMermas.json();
    const datosProductos = await respProductos.json();
    setMermas(datosMermas.mermas ?? []);
    setProductosCaducidad(
      (datosProductos.productos ?? []).filter(
        (p: { fechaCaducidad: string | null }) => p.fechaCaducidad
      )
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => cargar(), 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const productosOrdenados = [...productosCaducidad].sort(
    (a, b) => new Date(a.fechaCaducidad).getTime() - new Date(b.fechaCaducidad).getTime()
  );

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.back()}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Reportes
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mermas y caducidades</h1>
        <Boton onClick={() => setModalAbierto(true)}>+ Registrar merma</Boton>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">Próximas a caducar</h2>
        {!cargando && productosOrdenados.length === 0 ? (
          <p className="text-texto-suave text-sm">
            Ningún producto tiene fecha de caducidad registrada. Agrégala desde Productos.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {productosOrdenados.map((p) => {
              const dias = diasHasta(p.fechaCaducidad);
              const vencido = dias < 0;
              const proximo = dias >= 0 && dias <= 7;
              return (
                <Tarjeta
                  key={p.id}
                  className={`p-4 flex items-center justify-between gap-3 ${
                    vencido ? "border-peligro" : proximo ? "border-alerta" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold">{p.nombre}</p>
                    <p className="text-texto-suave text-sm">
                      Caduca: {new Date(p.fechaCaducidad).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  {vencido ? (
                    <Insignia tono="peligro">Vencido hace {Math.abs(dias)} días</Insignia>
                  ) : proximo ? (
                    <Insignia tono="alerta">En {dias} días</Insignia>
                  ) : (
                    <Insignia tono="neutral">En {dias} días</Insignia>
                  )}
                </Tarjeta>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">Historial de mermas</h2>
        {!cargando && mermas.length === 0 && (
          <EstadoVacio
            titulo="No hay mermas registradas"
            descripcion="Registra una cuando se dañe, caduque o falte producto."
          />
        )}
        <div className="flex flex-col gap-2">
          {mermas.map((m) => (
            <Tarjeta key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{m.producto.nombre}</p>
                <p className="text-texto-suave text-sm">
                  {new Date(m.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                  {" · "}
                  {ETIQUETA_MOTIVO[m.motivo]}
                  {m.nota ? ` · ${m.nota}` : ""}
                </p>
              </div>
              <p className="font-bold shrink-0">
                −{Number(m.cantidad)} {ETIQUETA_UNIDAD[m.producto.unidad]}
              </p>
            </Tarjeta>
          ))}
        </div>
      </div>

      {modalAbierto && (
        <ModalMerma
          onCerrar={() => setModalAbierto(false)}
          onGuardada={() => {
            setModalAbierto(false);
            mostrar("Merma registrada");
            cargar();
          }}
        />
      )}
    </div>
  );
}
