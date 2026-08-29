import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/tenant";
import { calcularAcceso } from "@/lib/suscripcion";
import { NavPrincipal } from "@/components/dashboard/nav";

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const tienda = await prisma.tienda.findUnique({
    where: { id: sesion.tiendaId },
    select: { nombre: true, exentaDePago: true, suscripcion: true },
  });

  if (!tienda) {
    redirect("/login");
  }

  const acceso = calcularAcceso(tienda, tienda.suscripcion);
  if (acceso.bloqueado) {
    redirect("/suscripcion");
  }

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <NavPrincipal nombreTienda={tienda.nombre} />
      {acceso.diasRestantesPrueba !== null && acceso.diasRestantesPrueba <= 5 && (
        <Link
          href="/suscripcion"
          className="bg-alerta-suave text-alerta text-sm text-center py-2 px-4 font-semibold hover:opacity-80"
        >
          Te quedan {acceso.diasRestantesPrueba}{" "}
          {acceso.diasRestantesPrueba === 1 ? "día" : "días"} de prueba gratis · Suscribirme
        </Link>
      )}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
