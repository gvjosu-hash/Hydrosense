"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { LISTA_PLANES } from "@/lib/planes";
import type { PlanSuscripcion } from "@prisma/client";

export function ActivarSuscripcion() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [plan, setPlan] = useState<PlanSuscripcion>("BASICO");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function activar() {
    setError("");
    setExito("");
    if (!correo.trim()) {
      setError("Escribe el correo de la tienda");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch("/api/admin/suscripciones/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo.trim(), plan }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo activar la suscripción");
        return;
      }
      setExito(`${datos.tiendaNombre} quedó activa en ${datos.plan}`);
      setCorreo("");
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-texto-suave text-sm">
        Para un cliente que te pagó por fuera de Mercado Pago (transferencia, efectivo, etc.) y no
        quieres dejar sin servicio. Actívalo por 30 días con esto.
      </p>
      <Campo
        etiqueta="Correo de la tienda"
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="correo@tienda.com"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanSuscripcion)}
          className="border border-borde rounded-md p-2 bg-fondo"
        >
          {LISTA_PLANES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — ${p.precio}/mes
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-peligro font-medium text-sm">{error}</p>}
      {exito && <p className="text-ok font-medium text-sm">{exito}</p>}
      <Boton disabled={cargando} onClick={activar}>
        {cargando ? "Activando..." : "Activar 30 días"}
      </Boton>
    </div>
  );
}
