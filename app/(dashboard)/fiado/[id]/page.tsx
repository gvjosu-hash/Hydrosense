"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ModalAbono, ResultadoAbono } from "@/components/fiado/modal-abono";

interface Cliente {
  id: string;
  nombre: string;
  whatsapp: string | null;
}

interface Movimiento {
  tipo: "venta" | "abono";
  id: string;
  fecha: string;
  monto: string;
  detalle: string | null;
}

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function PaginaClienteFiado() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { mostrar } = useToast();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    const respuesta = await fetch(`/api/clientes/${params.id}`);
    if (!respuesta.ok) {
      setNoEncontrado(true);
      setCargando(false);
      return;
    }
    const datos = await respuesta.json();
    setCliente(datos.cliente);
    setSaldoPendiente(Number(datos.saldoPendiente));
    setMovimientos(datos.movimientos ?? []);
    setCargando(false);
  }, [params.id]);

  useEffect(() => {
    const temporizador = setTimeout(() => cargar(), 0);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  async function registrarAbono(resultado: ResultadoAbono) {
    setGuardando(true);
    setError("");
    try {
      const respuesta = await fetch(`/api/clientes/${params.id}/abonos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultado),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo registrar el abono");
        return;
      }
      mostrar("Abono registrado");
      setModalAbierto(false);
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return null;

  if (noEncontrado || !cliente) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <p className="text-texto-suave">Cliente no encontrado.</p>
        <button onClick={() => router.push("/fiado")} className="text-acento font-semibold mt-2">
          Volver a Fiado
        </button>
      </div>
    );
  }

  const enlaceWhatsapp = cliente.whatsapp
    ? `https://wa.me/${cliente.whatsapp}?text=${encodeURIComponent(
        `Hola ${cliente.nombre}, te escribo de tu cuenta: debes $${saldoPendiente.toFixed(2)}.`
      )}`
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <button
        onClick={() => router.push("/fiado")}
        className="text-acento font-semibold text-sm self-start cursor-pointer"
      >
        ← Fiado
      </button>

      <Tarjeta className="p-5 flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
          {cliente.whatsapp && <p className="text-texto-suave">WhatsApp: {cliente.whatsapp}</p>}
        </div>
        <div>
          <p className="text-texto-suave text-sm">Debe</p>
          <p className={`text-3xl font-bold ${saldoPendiente > 0 ? "text-alerta" : "text-ok"}`}>
            ${saldoPendiente.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Boton
            tamano="grande"
            className="flex-1"
            onClick={() => setModalAbierto(true)}
            disabled={saldoPendiente <= 0}
          >
            Registrar abono
          </Boton>
          {enlaceWhatsapp && (
            <a href={enlaceWhatsapp} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Boton variante="secundario" tamano="grande" className="w-full">
                Recordar por WhatsApp
              </Boton>
            </a>
          )}
        </div>
      </Tarjeta>

      <div>
        <h2 className="text-xl font-bold mb-2">Historial</h2>
        <div className="flex flex-col gap-2">
          {movimientos.map((m) => (
            <Tarjeta key={`${m.tipo}-${m.id}`} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{m.tipo === "venta" ? "Venta fiada" : "Abono"}</p>
                <p className="text-texto-suave text-sm truncate">
                  {formatoFecha(m.fecha)}
                  {m.detalle ? ` · ${m.detalle}` : ""}
                </p>
              </div>
              <p className={`font-bold shrink-0 ${m.tipo === "venta" ? "text-alerta" : "text-ok"}`}>
                {m.tipo === "venta" ? "+" : "−"}${Number(m.monto).toFixed(2)}
              </p>
            </Tarjeta>
          ))}
        </div>
      </div>

      {modalAbierto && (
        <ModalAbono
          nombreCliente={cliente.nombre}
          saldoPendiente={saldoPendiente}
          onConfirmar={registrarAbono}
          onCerrar={() => setModalAbierto(false)}
          guardando={guardando}
          error={error}
        />
      )}
    </div>
  );
}
