"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PlanSuscripcion } from "@prisma/client";
import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";
import { LISTA_PLANES } from "@/lib/planes";

export default function PaginaRegistro() {
  const router = useRouter();
  const [nombreTienda, setNombreTienda] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<PlanSuscripcion>("BASICO");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreTienda, nombreUsuario, correo, password, plan }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No pudimos crear tu cuenta");
        return;
      }
      router.push("/pos");
      router.refresh();
    } catch {
      setError("No pudimos conectar. Revisa tu internet e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
        <Xolo className="w-16 h-auto" />
        <h1 className="text-3xl font-bold text-center">Crea tu tienda en Xolo</h1>
      </div>
      <Tarjeta className="w-full max-w-md p-6">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo
            id="nombreTienda"
            etiqueta="Nombre de tu tienda"
            placeholder="Mi Negocio"
            value={nombreTienda}
            onChange={(e) => setNombreTienda(e.target.value)}
            required
          />
          <Campo
            id="nombreUsuario"
            etiqueta="Tu nombre"
            placeholder="Roberto López"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <Campo
              id="correo"
              etiqueta="Correo"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
            <p className="text-texto-suave text-sm">
              Debe ser el correo que tengas vinculado a tu cuenta de Mercado Pago: con él vas a
              pagar tu suscripción.
            </p>
          </div>
          <Campo
            id="password"
            etiqueta="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-medium text-texto">Tamaño de tu negocio</p>
            <div className="grid grid-cols-3 gap-2">
              {LISTA_PLANES.map((p) => {
                const elegido = plan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-3 text-center cursor-pointer transition-colors ${
                      elegido ? "border-acento bg-acento/10" : "border-borde hover:border-acento-suave"
                    }`}
                  >
                    <span className="font-bold text-sm">{p.nombre.replace("Plan ", "")}</span>
                    <span className="text-texto-suave text-xs">
                      {p.limiteProductos ? `${p.limiteProductos} prod.` : "Ilimitado"}
                    </span>
                    <span className="font-bold text-sm">${p.precio}/mes</span>
                  </button>
                );
              })}
            </div>
            <p className="text-texto-suave text-sm">
              Puedes cambiar de plan cuando quieras. Tu prueba gratis aplica igual para los tres.
            </p>
          </div>
          {error && <p className="text-peligro font-medium">{error}</p>}
          <Boton type="submit" tamano="grande" disabled={cargando}>
            {cargando ? "Creando tu tienda..." : "Crear mi tienda"}
          </Boton>
        </form>
      </Tarjeta>
      <p className="mt-6 text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-acento font-semibold">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
