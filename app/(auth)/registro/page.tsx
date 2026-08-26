"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";

export default function PaginaRegistro() {
  const router = useRouter();
  const [nombreTienda, setNombreTienda] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contacto, setContacto] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ nombreTienda, nombreUsuario, contacto, password }),
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
            placeholder="Abarrotes Don Beto"
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
          <Campo
            id="contacto"
            etiqueta="Correo o WhatsApp"
            placeholder="tucorreo@ejemplo.com o 55 1234 5678"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            required
          />
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
