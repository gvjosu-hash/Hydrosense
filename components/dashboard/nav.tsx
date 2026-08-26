"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Xolo } from "@/components/mascota/xolo";

const ENLACES = [
  { href: "/pos", etiqueta: "Cobrar" },
  { href: "/productos", etiqueta: "Productos" },
  { href: "/inventario", etiqueta: "Inventario" },
  { href: "/corte-caja", etiqueta: "Corte de caja" },
];

export function NavPrincipal({ nombreTienda }: { nombreTienda: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between border-b border-borde bg-superficie px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Xolo className="w-7 h-auto" />
            <span className="font-bold text-lg">Xolo</span>
          </div>
          <span className="text-texto-suave">{nombreTienda}</span>
          <nav className="flex gap-1">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={`px-4 py-2 rounded-xl font-medium ${
                  pathname === enlace.href
                    ? "bg-acento-suave text-acento-fuerte"
                    : "text-texto-suave hover:bg-black/5"
                }`}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={salir}
          className="text-texto-suave hover:text-peligro font-medium cursor-pointer"
        >
          Cerrar sesión
        </button>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-superficie border-t border-borde flex">
        {ENLACES.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`flex-1 text-center py-3 text-sm font-semibold ${
              pathname === enlace.href ? "text-acento" : "text-texto-suave"
            }`}
          >
            {enlace.etiqueta}
          </Link>
        ))}
      </nav>
    </>
  );
}
