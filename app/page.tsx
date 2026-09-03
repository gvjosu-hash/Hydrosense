import Link from "next/link";
import { redirect } from "next/navigation";
import { Xolo } from "@/components/mascota/xolo";
import { Boton } from "@/components/ui/button";
import { obtenerSesion } from "@/lib/tenant";
import { fraseMarcaAleatoria } from "@/lib/frases-marca";

export default async function Home() {
  const sesion = await obtenerSesion();
  if (sesion) {
    redirect("/pos");
  }

  const frase = fraseMarcaAleatoria();

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <Xolo variante="icono" className="w-28 h-auto" />
      <div className="flex flex-col items-center -mt-2">
        <h1 className="text-5xl font-bold tracking-tight">XOLO</h1>
        <p className="text-texto-suave text-sm mt-1">{frase}</p>
      </div>
      <p className="font-serif italic text-xl text-texto-suave -mt-2">
        El punto de venta para cualquier negocio.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link href="/registro" className="w-full">
          <Boton tamano="grande" className="w-full">
            Crear mi tienda
          </Boton>
        </Link>
        <Link href="/login" className="w-full">
          <Boton variante="secundario" tamano="grande" className="w-full">
            Iniciar sesión
          </Boton>
        </Link>
      </div>
    </main>
  );
}
