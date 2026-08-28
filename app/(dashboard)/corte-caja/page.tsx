"use client";

import { useCallback, useEffect, useState } from "react";
import { Tarjeta } from "@/components/ui/card";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";
import { Insignia } from "@/components/ui/badge";
import { Xolo } from "@/components/mascota/xolo";
import { useToast } from "@/components/ui/toast";

interface Resumen {
  desde: string;
  hasta: string;
  totalSistema: number;
  numeroVentas: number;
  totalFiado: number;
  totalTarjeta: number;
  totalAbonosEfectivo: number;
  totalAbonosTarjeta: number;
  desglosePorMetodo: { metodoPago: string; total: number; numeroVentas: number }[];
}

interface Corte {
  id: string;
  fecha: string;
  totalSistema: string;
  totalCapturado: string;
  diferencia: string;
}

const ETIQUETA_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  FIADO: "Fiado",
};

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PaginaCorteCaja() {
  const { mostrar } = useToast();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [historial, setHistorial] = useState<Corte[]>([]);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [totalCapturado, setTotalCapturado] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");

  const cargarResumen = useCallback(async () => {
    const respuesta = await fetch("/api/cortes-caja/resumen");
    setResumen(await respuesta.json());
  }, []);

  const cargarHistorial = useCallback(async (fecha: string) => {
    const params = new URLSearchParams();
    if (fecha) {
      const inicio = new Date(`${fecha}T00:00:00`);
      const fin = new Date(`${fecha}T23:59:59.999`);
      params.set("desde", inicio.toISOString());
      params.set("hasta", fin.toISOString());
    }
    const respuesta = await fetch(`/api/cortes-caja?${params.toString()}`);
    const datos = await respuesta.json();
    setHistorial(datos.cortes ?? []);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => cargarResumen(), 0);
    return () => clearTimeout(temporizador);
  }, [cargarResumen]);

  useEffect(() => {
    const temporizador = setTimeout(() => cargarHistorial(filtroFecha), 0);
    return () => clearTimeout(temporizador);
  }, [filtroFecha, cargarHistorial]);

  async function cerrarCorte() {
    setError("");
    setCerrando(true);
    try {
      const respuesta = await fetch("/api/cortes-caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalCapturado: Number(totalCapturado || 0) }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo cerrar el corte");
        return;
      }
      mostrar("Corte cerrado");
      setTotalCapturado("");
      await Promise.all([cargarResumen(), cargarHistorial(filtroFecha)]);
    } finally {
      setCerrando(false);
    }
  }

  const diferencia = totalCapturado === "" ? null : Number(totalCapturado) - (resumen?.totalSistema ?? 0);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Corte de caja</h1>

      <Tarjeta className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-texto-suave text-sm">
            {resumen ? `Efectivo desde ${formatoFecha(resumen.desde)}` : "Cargando..."}
          </p>
          <p className="text-3xl font-bold mt-1">
            ${(resumen?.totalSistema ?? 0).toFixed(2)}
          </p>
          <p className="text-texto-suave">
            {resumen?.numeroVentas ?? 0} venta{resumen?.numeroVentas === 1 ? "" : "s"} en efectivo
            {resumen && resumen.totalAbonosEfectivo > 0 && (
              <> + ${resumen.totalAbonosEfectivo.toFixed(2)} en abonos</>
            )}
            {resumen && (resumen.totalFiado > 0 || resumen.totalTarjeta > 0) && (
              <>
                {" · "}
                {[
                  resumen.totalTarjeta > 0 ? `$${resumen.totalTarjeta.toFixed(2)} con tarjeta` : null,
                  resumen.totalFiado > 0 ? `$${resumen.totalFiado.toFixed(2)} fiados` : null,
                ]
                  .filter(Boolean)
                  .join(" y ")}{" "}
                (no cuentan en la caja)
              </>
            )}
          </p>
        </div>

        {resumen &&
          (resumen.desglosePorMetodo.length > 0 ||
            resumen.totalAbonosEfectivo > 0 ||
            resumen.totalAbonosTarjeta > 0) && (
            <div className="flex flex-col gap-1 border-t border-borde pt-3">
              {resumen.desglosePorMetodo.map((d) => (
                <div key={d.metodoPago} className="flex justify-between text-sm">
                  <span>
                    {ETIQUETA_METODO[d.metodoPago] ?? d.metodoPago} ({d.numeroVentas})
                  </span>
                  <span className="font-medium">${d.total.toFixed(2)}</span>
                </div>
              ))}
              {resumen.totalAbonosEfectivo > 0 && (
                <div className="flex justify-between text-sm text-texto-suave">
                  <span>Abonos en efectivo</span>
                  <span className="font-medium">${resumen.totalAbonosEfectivo.toFixed(2)}</span>
                </div>
              )}
              {resumen.totalAbonosTarjeta > 0 && (
                <div className="flex justify-between text-sm text-texto-suave">
                  <span>Abonos con tarjeta</span>
                  <span className="font-medium">${resumen.totalAbonosTarjeta.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

        <div className="border-t border-borde pt-4 flex flex-col gap-3">
          <Campo
            etiqueta="Efectivo contado en caja"
            type="number"
            step="0.01"
            min="0"
            value={totalCapturado}
            onChange={(e) => setTotalCapturado(e.target.value)}
          />
          {diferencia !== null && (
            <div
              className={`rounded-xl p-3 text-center font-bold ${
                diferencia === 0
                  ? "bg-ok-suave text-ok"
                  : diferencia > 0
                  ? "bg-alerta-suave text-alerta"
                  : "bg-peligro-suave text-peligro"
              }`}
            >
              {diferencia === 0
                ? "Cuadra exacto"
                : diferencia > 0
                ? `Sobrante: $${diferencia.toFixed(2)}`
                : `Faltante: $${Math.abs(diferencia).toFixed(2)}`}
            </div>
          )}
          {error && <p className="text-peligro font-medium">{error}</p>}
          <Boton
            tamano="grande"
            onClick={cerrarCorte}
            disabled={
              cerrando ||
              totalCapturado === "" ||
              ((resumen?.totalSistema ?? 0) === 0 &&
                (resumen?.totalFiado ?? 0) === 0 &&
                (resumen?.totalTarjeta ?? 0) === 0)
            }
          >
            {cerrando ? "Cerrando..." : "Cerrar corte"}
          </Boton>
          {(resumen?.totalSistema ?? 0) === 0 &&
            (resumen?.totalFiado ?? 0) === 0 &&
            (resumen?.totalTarjeta ?? 0) === 0 && (
            <p className="text-texto-suave text-sm text-center">
              No hay ventas nuevas desde el último corte.
            </p>
          )}
        </div>
      </Tarjeta>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-xl font-bold">Historial</h2>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-borde-fuerte"
          />
        </div>

        {historial.length === 0 && (
          <div className="flex flex-col items-center text-center gap-2 py-8">
            <Xolo className="w-14 h-auto opacity-60" />
            <p className="text-texto-suave">No hay cortes registrados en este rango.</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {historial.map((corte) => {
            const dif = Number(corte.diferencia);
            return (
              <Tarjeta key={corte.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{formatoFecha(corte.fecha)}</p>
                  <p className="text-texto-suave text-sm">
                    Sistema ${Number(corte.totalSistema).toFixed(2)} · Contado $
                    {Number(corte.totalCapturado).toFixed(2)}
                  </p>
                </div>
                <Insignia tono={dif === 0 ? "ok" : dif > 0 ? "alerta" : "peligro"}>
                  {dif === 0 ? "Cuadrado" : dif > 0 ? `+$${dif.toFixed(2)}` : `-$${Math.abs(dif).toFixed(2)}`}
                </Insignia>
              </Tarjeta>
            );
          })}
        </div>
      </div>
    </div>
  );
}
