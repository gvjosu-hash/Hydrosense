import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/tenant";
import { NavPrincipal } from "@/components/dashboard/nav";

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const tienda = await prisma.tienda.findUnique({
    where: { id: sesion.tiendaId },
    select: { nombre: true },
  });

  if (!tienda) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <NavPrincipal nombreTienda={tienda.nombre} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
