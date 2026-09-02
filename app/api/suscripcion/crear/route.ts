import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { obtenerClienteMercadoPago } from "@/lib/mercadopago";
import { esquemaCrearSuscripcion } from "@/lib/validaciones/suscripcion";
import { PLANES } from "@/lib/planes";

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
    const plan = PLANES[datos.plan];

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
    // Mercado Pago rechaza un start_date que para cuando su API valida la
    // solicitud ya "pasó" (aunque al generarlo aquí fuera exactamente
    // "ahora"): unos minutos de margen evitan ese choque de tiempos.
    const MARGEN_INICIO_COBRO_MS = 5 * 60 * 1000;
    const fechaFinPrueba = tienda.suscripcion?.fechaFinPrueba ?? null;
    const inicioCobro =
      fechaFinPrueba && fechaFinPrueba.getTime() > Date.now() + MARGEN_INICIO_COBRO_MS
        ? fechaFinPrueba
        : new Date(Date.now() + MARGEN_INICIO_COBRO_MS);

    const cliente = obtenerClienteMercadoPago();
    const preapproval = await new PreApproval(cliente).create({
      body: {
        reason: `Xolo - ${plan.nombre}`,
        external_reference: tienda.id,
        // payer_email es obligatorio para Mercado Pago (aunque el SDK lo
        // marque como opcional en sus tipos, la API lo rechaza sin él).
        // OJO: quien pague debe estar loggeado en Mercado Pago con este
        // mismo correo exacto, o el checkout lo rechaza — avisar bien de
        // esto en la pantalla de suscripción.
        payer_email: correo,
        back_url: `${origen}/suscripcion`,
        auto_recurring: {
          // 30 días fijos, no "1 mes": así el cobro no se recorre según el
          // mes tenga 28, 30 o 31 días.
          frequency: 30,
          frequency_type: "days",
          start_date: inicioCobro.toISOString(),
          transaction_amount: plan.precio,
          currency_id: "MXN",
        },
      },
    });

    if (!preapproval.id || !preapproval.init_point) {
      throw new Error("Mercado Pago no devolvió los datos esperados de la suscripción");
    }

    await prisma.suscripcion.upsert({
      where: { tiendaId: tienda.id },
      update: { mpPreapprovalId: preapproval.id, plan: plan.id },
      create: {
        tiendaId: tienda.id,
        estado: "PRUEBA",
        mpPreapprovalId: preapproval.id,
        plan: plan.id,
      },
    });

    return NextResponse.json({ initPoint: preapproval.init_point });
  } catch (error) {
    return respuestaError(error);
  }
}
