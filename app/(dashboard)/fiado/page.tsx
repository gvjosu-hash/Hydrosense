"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Campo } from "@/components/ui/input";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { EstadoVacio } from "@/components/ui/estado-vacio";

interface Cliente {
  id: string;
  nombre: string;
  whatsapp: string | null;
  saldoPendiente: string;
}

export default function PaginaFiado() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [soloConSaldo, setSoloConSaldo] = useState(true);
  const [cargando, setCargando] = useState(true);

  const cargarClientes = useCallback(async (texto: string) => {
    setCargando(true);
    const params = new URLSearchParams();
    if (texto) params.set("buscar", texto);
    const respuesta = await fetch(`/api/clientes?${params.toString()}`);
    const datos = await respuesta.json();
    setClientes(datos.clientes ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => cargarClientes(busqueda), 250);
    return () => clearTimeout(temporizador);
  }, [busqueda, cargarClientes]);

  const clientesFiltrados = clientes.filter(
    (c) => !soloConSaldo || Number(c.saldoPendiente) !== 0
  );

  const totalPorCobrar = clientes.reduce((suma, c) => suma + Number(c.saldoPendiente), 0);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Fiado</h1>
        {totalPorCobrar > 0 && (
          <Insignia tono="alerta">${totalPorCobrar.toFixed(2)} por cobrar</Insignia>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Campo
            placeholder="Buscar cliente por nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button
          onClick={() => setSoloConSaldo((v) => !v)}
          className={`px-4 py-3 min-h-12 rounded-xl border-2 font-semibold whitespace-nowrap cursor-pointer ${
            soloConSaldo
              ? "border-acento bg-acento-suave text-acento-fuerte"
              : "border-borde-fuerte text-texto-suave"
          }`}
        >
          Solo con saldo
        </button>
      </div>

      {!cargando && clientesFiltrados.length === 0 && (
        <EstadoVacio
          titulo={busqueda ? "No encontramos ese cliente" : "No hay cuentas pendientes"}
          descripcion={
            busqueda
              ? "Intenta con otro nombre."
              : "Cuando fíes una venta desde Cobrar, el cliente va a aparecer aquí."
          }
        />
      )}

      <div className="flex flex-col gap-2">
        {clientesFiltrados.map((cliente) => {
          const saldo = Number(cliente.saldoPendiente);
          return (
            <Link key={cliente.id} href={`/fiado/${cliente.id}`}>
              <Tarjeta className="p-4 flex items-center justify-between gap-3 hover:bg-black/5">
                <div className="min-w-0">
                  <p className="font-semibold text-lg truncate">{cliente.nombre}</p>
                  {cliente.whatsapp && (
                    <p className="text-texto-suave text-sm">WhatsApp: {cliente.whatsapp}</p>
                  )}
                </div>
                <p className={`font-bold text-lg shrink-0 ${saldo > 0 ? "text-alerta" : "text-ok"}`}>
                  ${saldo.toFixed(2)}
                </p>
              </Tarjeta>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
