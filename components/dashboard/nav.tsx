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
      <header className="flex items-center justify-between border-b border-borde bg-superficie px-4 sm:px-6 py-3 gap-3">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Xolo className="w-7 h-auto" />
            <span className="font-bold text-lg hidden sm:inline">Xolo</span>
          </div>
          <span className="text-texto-suave truncate">{nombreTienda}</span>
          <nav className="hidden md:flex gap-1 shrink-0">
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
          className="text-texto-suave hover:text-peligro font-medium cursor-pointer shrink-0"
        >
          <span className="hidden sm:inline">Cerrar sesión</span>
          <span className="sm:hidden">Salir</span>
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
