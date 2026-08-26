import Link from "next/link";
import { Xolo } from "@/components/mascota/xolo";
import { Boton } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <Xolo pose="contento" className="w-32 h-32 text-acento" />
      <div>
        <h1 className="text-4xl font-bold">Xolo</h1>
        <p className="text-xl text-texto-suave mt-2">
          El punto de venta para tu tienda de abarrotes.
        </p>
      </div>
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
