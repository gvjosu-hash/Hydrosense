import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/tenant";
import { calcularAcceso } from "@/lib/suscripcion";
import { Xolo } from "@/components/mascota/xolo";
import { PRECIO_SUSCRIPCION_MXN } from "@/lib/mercadopago";
import { PanelSuscripcion } from "@/components/suscripcion/panel-suscripcion";

export default async function PaginaSuscripcion() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const tienda = await prisma.tienda.findUnique({
    where: { id: sesion.tiendaId },
    select: {
      nombre: true,
      exentaDePago: true,
      suscripcion: true,
      usuarios: { where: { id: sesion.usuarioId }, select: { correo: true } },
    },
  });
  if (!tienda) {
    redirect("/login");
  }

  const acceso = calcularAcceso(tienda, tienda.suscripcion);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
        <Xolo className="w-16 h-auto" />
        <h1 className="text-3xl font-bold text-center">{tienda.nombre}</h1>
      </div>
      <PanelSuscripcion
        exenta={tienda.exentaDePago}
        estado={tienda.suscripcion?.estado ?? null}
        diasRestantesPrueba={acceso.diasRestantesPrueba}
        fechaProximoCobro={tienda.suscripcion?.fechaProximoCobro?.toISOString() ?? null}
        correoConocido={tienda.usuarios[0]?.correo ?? null}
        precioMensual={PRECIO_SUSCRIPCION_MXN}
      />
    </main>
  );
}
