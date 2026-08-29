import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { obtenerClienteMercadoPago } from "@/lib/mercadopago";

export async function POST() {
  try {
    const sesion = await requerirSesion();

    const suscripcion = await prisma.suscripcion.findUnique({
      where: { tiendaId: sesion.tiendaId },
    });
    if (!suscripcion?.mpPreapprovalId) {
      return NextResponse.json({ error: "No hay una suscripción activa que cancelar" }, { status: 400 });
    }

    const cliente = obtenerClienteMercadoPago();
    await new PreApproval(cliente).update({
      id: suscripcion.mpPreapprovalId,
      body: { status: "cancelled" },
    });

    const actualizada = await prisma.suscripcion.update({
      where: { tiendaId: sesion.tiendaId },
      data: { estado: "CANCELADA" },
    });

    return NextResponse.json({ suscripcion: actualizada });
  } catch (error) {
    return respuestaError(error);
  }
}
