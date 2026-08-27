"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const REPORTES = [
  {
    href: "/reportes/ventas",
    etiqueta: "Registro de ventas",
    descripcion: "Todas las ventas, quién atendió y a quién se le fió",
  },
  {
    href: "/reportes/existencias",
    etiqueta: "Existencias (stock actual)",
    descripcion: "Inventario y valor total en existencia",
  },
  {
    href: "/reportes/ventas-diarias",
    etiqueta: "Ventas diarias",
    descripcion: "Totales por día, efectivo y fiado",
  },
  {
    href: "/reportes/mermas",
    etiqueta: "Mermas y caducidades",
    descripcion: "Pérdidas de producto y fechas próximas a vencer",
  },
  {
    href: "/reportes/reorden",
    etiqueta: "Reorden / punto de reorden",
    descripcion: "Qué productos conviene volver a pedir",
  },
  {
    href: "/reportes/utilidad",
    etiqueta: "Utilidad bruta",
    descripcion: "Ganancia por producto o categoría",
  },
];

export function MenuReportes({ onCerrar }: { onCerrar: () => void }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        aria-label="Cerrar menú de reportes"
        onClick={onCerrar}
        className="flex-1 bg-black/40 cursor-pointer"
      />
      <div className="w-full max-w-xs bg-superficie h-full overflow-y-auto flex flex-col border-l border-borde shadow-[var(--sombra-flotante)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde sticky top-0 bg-superficie">
          <h2 className="text-xl font-bold">Reportes</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-2xl leading-none text-texto-suave hover:text-texto px-2 cursor-pointer"
          >
            ×
          </button>
        </div>
        <nav className="flex flex-col p-2">
          {REPORTES.map((reporte) => (
            <Link
              key={reporte.href}
              href={reporte.href}
              onClick={onCerrar}
              className={`px-3 py-3 rounded-xl flex flex-col gap-0.5 ${
                pathname === reporte.href ? "bg-acento-suave text-acento-fuerte" : "hover:bg-black/5"
              }`}
            >
              <span className="font-semibold">{reporte.etiqueta}</span>
              <span className="text-sm text-texto-suave">{reporte.descripcion}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
