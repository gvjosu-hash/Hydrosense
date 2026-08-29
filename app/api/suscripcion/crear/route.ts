import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { obtenerClienteMercadoPago, PRECIO_SUSCRIPCION_MXN } from "@/lib/mercadopago";
import { esquemaCrearSuscripcion } from "@/lib/validaciones/suscripcion";

export async function POST(request: Request) {
  try {
    const sesion = await requerirSesion();

    const tienda = await prisma.tienda.findUnique({
      where: { id: sesion.tiendaId },
      include: { suscripcion: true, usuarios: { where: { id: sesion.usuarioId } } },
    });
    if (!tienda) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }
    if (tienda.exentaDePago) {
      return NextResponse.json(
        { error: "Esta tienda tiene acceso permanente, no necesita suscripción" },
        { status: 400 }
      );
    }

    const usuario = tienda.usuarios[0];
    const cuerpo = await request.json().catch(() => ({}));
    const datos = esquemaCrearSuscripcion.parse(cuerpo);

    let correo = usuario.correo;
    if (!correo) {
      if (!datos.correo) {
        return NextResponse.json(
          { error: "Necesitamos un correo para asociar la suscripción" },
          { status: 400 }
        );
      }
      const correoEnUso = await prisma.usuario.findUnique({ where: { correo: datos.correo } });
      if (correoEnUso && correoEnUso.id !== usuario.id) {
        return NextResponse.json({ error: "Ese correo ya está en uso" }, { status: 409 });
      }
      correo = datos.correo;
      await prisma.usuario.update({ where: { id: usuario.id }, data: { correo } });
    }

    const origen = new URL(request.url).origin;
    const fechaFinPrueba = tienda.suscripcion?.fechaFinPrueba ?? null;
    const inicioCobro =
      fechaFinPrueba && fechaFinPrueba.getTime() > Date.now() ? fechaFinPrueba : new Date();

    const cliente = obtenerClienteMercadoPago();
    const preapproval = await new PreApproval(cliente).create({
      body: {
        reason: "Xolo - Suscripción mensual",
        external_reference: tienda.id,
        payer_email: correo,
        back_url: `${origen}/suscripcion`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          start_date: inicioCobro.toISOString(),
          transaction_amount: PRECIO_SUSCRIPCION_MXN,
          currency_id: "MXN",
        },
      },
    });

    if (!preapproval.id || !preapproval.init_point) {
      throw new Error("Mercado Pago no devolvió los datos esperados de la suscripción");
    }

    await prisma.suscripcion.upsert({
      where: { tiendaId: tienda.id },
      update: { mpPreapprovalId: preapproval.id },
      create: {
        tiendaId: tienda.id,
        estado: "PRUEBA",
        mpPreapprovalId: preapproval.id,
      },
    });

    return NextResponse.json({ initPoint: preapproval.init_point });
  } catch (error) {
    return respuestaError(error);
  }
}
