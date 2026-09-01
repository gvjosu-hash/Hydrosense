import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requerirAdminPlataforma } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { PLANES } from "@/lib/planes";

const esquemaActivar = z.object({
  correo: z.string().trim().email("Escribe un correo válido"),
  plan: z.enum(["BASICO", "MEDIANO", "COMPLETO"]),
});

// Activa una suscripción a mano (cobro fuera de Mercado Pago: transferencia,
// efectivo, etc.), para no dejar a una tienda sin servicio mientras el
// cobro automático por Mercado Pago no esté disponible. Solo el equipo de
// Xolo (esAdminPlataforma) puede usar esto.
export async function POST(request: Request) {
  try {
    await requerirAdminPlataforma();
    const cuerpo = await request.json();
    const datos = esquemaActivar.parse(cuerpo);

    const usuario = await prisma.usuario.findUnique({
      where: { correo: datos.correo },
      select: { tiendaId: true, tienda: { select: { nombre: true } } },
    });
    if (!usuario) {
      return NextResponse.json(
        { error: "No hay ninguna tienda con ese correo" },
        { status: 404 }
      );
    }

    const plan = PLANES[datos.plan];
    const fechaProximoCobro = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.suscripcion.upsert({
      where: { tiendaId: usuario.tiendaId },
      update: { estado: "ACTIVA", plan: plan.id, fechaProximoCobro },
      create: {
        tiendaId: usuario.tiendaId,
        estado: "ACTIVA",
        plan: plan.id,
        fechaProximoCobro,
      },
    });

    return NextResponse.json({ tiendaNombre: usuario.tienda.nombre, plan: plan.nombre });
  } catch (error) {
    return respuestaError(error);
  }
}
