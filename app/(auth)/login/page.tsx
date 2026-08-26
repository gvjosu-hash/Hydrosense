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
        <Xolo pose="sentado" className="w-20 h-20 text-acento" />
        <h1 className="text-3xl font-bold text-center">Bienvenido de vuelta</h1>
      </div>
      <Tarjeta className="w-full max-w-md p-6">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo
            id="identificador"
            etiqueta="Correo o WhatsApp"
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
