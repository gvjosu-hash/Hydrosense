"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { FormularioTarjeta } from "@/components/suscripcion/formulario-tarjeta";

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
  precioMensual,
}: {
  exenta: boolean;
  estado: Estado;
  diasRestantesPrueba: number | null;
  fechaProximoCobro: string | null;
  correoConocido: string | null;
  precioMensual: number;
}) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState("");
  const [usarRedireccion, setUsarRedireccion] = useState(false);

  const enPrueba = estado === "PRUEBA" && diasRestantesPrueba !== null;

  async function suscribirse() {
    setError("");
    if (!correoConocido && !correo.trim()) {
      setError("Escribe un correo para continuar");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch("/api/suscripcion/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correoConocido ? undefined : correo.trim() }),
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

  return (
    <Tarjeta className="w-full max-w-md p-6 flex flex-col gap-4">
      {estado === "ACTIVA" ? (
        <>
          <p className="text-ok font-semibold text-center">Tu suscripción está activa</p>
          <p className="text-texto-suave text-center">
            ${precioMensual.toFixed(2)} al mes
            {fechaProximoCobro && <> · próximo cobro {formatoFecha(fechaProximoCobro)}</>}
          </p>
          <Boton tamano="grande" onClick={() => router.push("/pos")}>
            Ir a Cobrar
          </Boton>
          <Boton
            variante="secundario"
            tamano="grande"
            disabled={cancelando}
            onClick={cancelar}
          >
            {cancelando ? "Cancelando..." : "Cancelar suscripción"}
          </Boton>
        </>
      ) : (
        <>
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

          <p className="text-center text-texto-suave">${precioMensual.toFixed(2)} MXN al mes</p>

          {usarRedireccion ? (
            <>
              {!correoConocido && (
                <Campo
                  etiqueta="Correo para tu suscripción"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoFocus
                />
              )}

              {error && <p className="text-peligro font-medium text-center">{error}</p>}

              <Boton tamano="grande" disabled={cargando} onClick={suscribirse}>
                {cargando ? "Redirigiendo..." : "Suscribirme con Mercado Pago"}
              </Boton>
              <button
                onClick={() => setUsarRedireccion(false)}
                className="text-acento font-semibold text-sm cursor-pointer"
              >
                Volver al formulario de tarjeta
              </button>
            </>
          ) : (
            <>
              <FormularioTarjeta
                correoInicial={correoConocido ?? ""}
                onAutorizada={() => router.refresh()}
              />
              <button
                onClick={() => setUsarRedireccion(true)}
                className="text-texto-suave text-sm cursor-pointer"
              >
                O suscríbete desde el sitio de Mercado Pago
              </button>
            </>
          )}
        </>
      )}

      <button
        onClick={salir}
        className="text-texto-suave hover:text-peligro font-medium text-sm cursor-pointer"
      >
        Cerrar sesión
      </button>
    </Tarjeta>
  );
}
