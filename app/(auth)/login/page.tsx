"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";

export default function PaginaLogin() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarEleccionModo, setMostrarEleccionModo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, password }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No pudimos iniciar tu sesión");
        return;
      }
      if (datos.usuario?.esAdminPlataforma) {
        setMostrarEleccionModo(true);
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

  function irA(destino: "/pos" | "/admin") {
    router.push(destino);
    router.refresh();
  }

  if (mostrarEleccionModo) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
          <Xolo className="w-16 h-auto" />
          <h1 className="text-3xl font-bold text-center">¿Cómo quieres entrar?</h1>
          <p className="text-texto-suave text-center">
            Esta cuenta tiene acceso vitalicio y al panel de administrador.
          </p>
        </div>
        <Tarjeta className="w-full max-w-md p-6 flex flex-col gap-3">
          <Boton tamano="grande" onClick={() => irA("/pos")}>
            Modo prueba (como una tienda normal)
          </Boton>
          <Boton tamano="grande" variante="secundario" onClick={() => irA("/admin")}>
            Administrador (suscripciones y pagos)
          </Boton>
        </Tarjeta>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
        <Xolo className="w-16 h-auto" />
        <h1 className="text-3xl font-bold text-center">Bienvenido de vuelta</h1>
      </div>
      <Tarjeta className="w-full max-w-md p-6">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo
            id="identificador"
            etiqueta="Correo"
            type="email"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
          />
          <Campo
            id="password"
            etiqueta="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-peligro font-medium">{error}</p>}
          <Boton type="submit" tamano="grande" disabled={cargando}>
            {cargando ? "Entrando..." : "Iniciar sesión"}
          </Boton>
        </form>
      </Tarjeta>
      <p className="mt-6 text-texto-suave">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-acento font-semibold">
          Crea tu tienda
        </Link>
      </p>
    </main>
  );
}
