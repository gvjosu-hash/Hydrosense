"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanSuscripcion } from "@prisma/client";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { LISTA_PLANES, PLANES } from "@/lib/planes";

type Estado = "PRUEBA" | "ACTIVA" | "PAGO_FALLIDO" | "CANCELADA" | null;

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "long" });
}

export function PanelSuscripcion({
  exenta,
  estado,
  diasRestantesPrueba,
  fechaProximoCobro,
  correoConocido,
  planActual,
}: {
  exenta: boolean;
  estado: Estado;
  diasRestantesPrueba: number | null;
  fechaProximoCobro: string | null;
  correoConocido: string | null;
  planActual: PlanSuscripcion | null;
}) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [planElegido, setPlanElegido] = useState<PlanSuscripcion | null>(planActual);
  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState("");

  const enPrueba = estado === "PRUEBA" && diasRestantesPrueba !== null;

  async function suscribirse() {
    setError("");
    if (!correoConocido && !correo.trim()) {
      setError("Escribe un correo para continuar");
      return;
    }
    if (!planElegido) {
      setError("Elige un plan para continuar");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch("/api/suscripcion/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: correoConocido ? undefined : correo.trim(),
          plan: planElegido,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo iniciar la suscripción");
        return;
      }
      window.location.href = datos.initPoint;
    } finally {
      setCargando(false);
    }
  }

  async function cancelar() {
    if (!confirm("¿Cancelar tu suscripción? Perderás el acceso cuando termine el periodo pagado.")) {
      return;
    }
    setCancelando(true);
    setError("");
    try {
      const respuesta = await fetch("/api/suscripcion/cancelar", { method: "POST" });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo cancelar");
        return;
      }
      router.refresh();
    } finally {
      setCancelando(false);
    }
  }

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (exenta) {
    return (
      <Tarjeta className="w-full max-w-md p-6 flex flex-col gap-3 text-center">
        <p className="text-ok font-semibold text-lg">Esta tienda tiene acceso permanente ✓</p>
        <Boton tamano="grande" onClick={() => router.push("/pos")}>
          Ir a Cobrar
        </Boton>
      </Tarjeta>
    );
  }

  if (estado === "ACTIVA") {
    const plan = planActual ? PLANES[planActual] : null;
    return (
      <Tarjeta className="w-full max-w-md p-6 flex flex-col gap-4">
        <p className="text-ok font-semibold text-center">Tu suscripción está activa</p>
        {plan && (
          <p className="text-texto-suave text-center">
            {plan.nombre} · ${plan.precio.toFixed(2)} al mes
            {fechaProximoCobro && <> · próximo cobro {formatoFecha(fechaProximoCobro)}</>}
          </p>
        )}
        <Boton tamano="grande" onClick={() => router.push("/pos")}>
          Ir a Cobrar
        </Boton>
        <Boton variante="secundario" tamano="grande" disabled={cancelando} onClick={cancelar}>
          {cancelando ? "Cancelando..." : "Cancelar suscripción"}
        </Boton>
        <button
          onClick={salir}
          className="text-texto-suave hover:text-peligro font-medium text-sm cursor-pointer"
        >
          Cerrar sesión
        </button>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="w-full max-w-lg p-6 flex flex-col gap-4">
      {enPrueba ? (
        <p className="text-center">
          Te quedan <span className="font-bold">{diasRestantesPrueba}</span> días de prueba
          gratis.
        </p>
      ) : estado === "PAGO_FALLIDO" ? (
        <p className="text-alerta font-semibold text-center">
          Hubo un problema con tu último cobro. Vuelve a suscribirte para seguir usando Xolo.
        </p>
      ) : estado === "CANCELADA" ? (
        <p className="text-texto-suave text-center">Tu suscripción está cancelada.</p>
      ) : (
        <p className="text-alerta font-semibold text-center">
          Tu prueba gratuita terminó. Suscríbete para seguir usando Xolo.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {LISTA_PLANES.map((plan) => {
          const elegido = planElegido === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPlanElegido(plan.id)}
              className={`flex flex-col gap-1 rounded-lg border-2 p-4 text-left cursor-pointer transition-colors ${
                elegido
                  ? "border-acento bg-acento/10"
                  : "border-borde hover:border-acento-suave"
              }`}
            >
              <p className="font-bold">{plan.nombre}</p>
              <p className="text-2xl font-bold">
                ${plan.precio}
                <span className="text-sm font-normal text-texto-suave">/mes</span>
              </p>
              <p className="text-texto-suave text-sm">{plan.descripcion}</p>
            </button>
          );
        })}
      </div>

      {!correoConocido && (
        <Campo
          etiqueta="Correo para tu suscripción"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          autoFocus
        />
      )}
      <p className="text-texto-suave text-xs text-center">
        Usa el mismo correo con el que vas a pagar en Mercado Pago.
      </p>

      {error && <p className="text-peligro font-medium text-center">{error}</p>}

      <Boton tamano="grande" disabled={cargando} onClick={suscribirse}>
        {cargando ? "Redirigiendo..." : "Suscribirme con Mercado Pago"}
      </Boton>

      <button
        onClick={salir}
        className="text-texto-suave hover:text-peligro font-medium text-sm cursor-pointer"
      >
        Cerrar sesión
      </button>
    </Tarjeta>
  );
}
