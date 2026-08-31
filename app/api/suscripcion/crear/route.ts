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
    // Mercado Pago rechaza un start_date que para cuando su API valida la
    // solicitud ya "pasó" (aunque al generarlo aquí fuera exactamente
    // "ahora"): unos minutos de margen evitan ese choque de tiempos.
    const MARGEN_INICIO_COBRO_MS = 5 * 60 * 1000;
    const fechaFinPrueba = tienda.suscripcion?.fechaFinPrueba ?? null;
    const inicioCobro =
      fechaFinPrueba && fechaFinPrueba.getTime() > Date.now() + MARGEN_INICIO_COBRO_MS
        ? fechaFinPrueba
        : new Date(Date.now() + MARGEN_INICIO_COBRO_MS);

    // Con cardTokenId (formulario de tarjeta embebido en Xolo) la tarjeta ya
    // se tokenizó en el navegador: se puede autorizar la suscripción directo,
    // sin mandar al usuario al checkout de Mercado Pago (back_url).
    const usaFormularioEmbebido = !!datos.cardTokenId;

    const cliente = obtenerClienteMercadoPago();
    const preapproval = await new PreApproval(cliente).create({
      body: {
        reason: "Xolo - Suscripción mensual",
        external_reference: tienda.id,
        payer_email: correo,
        // Mercado Pago exige back_url siempre, aunque la tarjeta ya venga
        // tokenizada y no haya redirección real.
        back_url: `${origen}/suscripcion`,
        ...(usaFormularioEmbebido
          ? { card_token_id: datos.cardTokenId, status: "authorized" }
          : {}),
        auto_recurring: {
          // 30 días fijos, no "1 mes": así el cobro no se recorre según el
          // mes tenga 28, 30 o 31 días.
          frequency: 30,
          frequency_type: "days",
          start_date: inicioCobro.toISOString(),
          transaction_amount: PRECIO_SUSCRIPCION_MXN,
          currency_id: "MXN",
        },
      },
    });

    if (!preapproval.id || (!usaFormularioEmbebido && !preapproval.init_point)) {
      throw new Error("Mercado Pago no devolvió los datos esperados de la suscripción");
    }
    if (usaFormularioEmbebido && preapproval.status !== "authorized") {
      return NextResponse.json(
        { error: "No se pudo autorizar la tarjeta. Verifica los datos e intenta de nuevo." },
        { status: 400 }
      );
    }

    await prisma.suscripcion.upsert({
      where: { tiendaId: tienda.id },
      update: {
        mpPreapprovalId: preapproval.id,
        ...(usaFormularioEmbebido
          ? {
              estado: "ACTIVA",
              fechaProximoCobro: preapproval.next_payment_date
                ? new Date(preapproval.next_payment_date)
                : undefined,
            }
          : {}),
      },
      create: {
        tiendaId: tienda.id,
        estado: usaFormularioEmbebido ? "ACTIVA" : "PRUEBA",
        mpPreapprovalId: preapproval.id,
        fechaProximoCobro:
          usaFormularioEmbebido && preapproval.next_payment_date
            ? new Date(preapproval.next_payment_date)
            : undefined,
      },
    });

    if (usaFormularioEmbebido) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ initPoint: preapproval.init_point });
  } catch (error) {
    return respuestaError(error);
  }
}
