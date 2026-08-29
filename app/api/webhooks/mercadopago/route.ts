import { NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import { prisma } from "@/lib/db";
import { obtenerClienteMercadoPago } from "@/lib/mercadopago";
import { estadoDesdeMercadoPago } from "@/lib/suscripcion";
import { validarFirmaWebhook } from "@/lib/mercadopago-firma";

// Ruta pública: Mercado Pago llama esto directo, sin sesión de Xolo. Está
// permitida en proxy.ts junto con /api/tickets.
export async function POST(request: Request) {
  try {
    const cuerpo = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);

    const tipo = cuerpo.type ?? searchParams.get("type") ?? searchParams.get("topic");
    const dataId = cuerpo.data?.id ?? searchParams.get("data.id") ?? searchParams.get("id");

    if (tipo !== "preapproval" && tipo !== "subscription_preapproval") {
      // No es una notificación de suscripción (puede ser un pago suelto u
      // otro topic): no hay nada que hacer aquí.
      return NextResponse.json({ recibido: true });
    }
    if (!dataId) {
      return NextResponse.json({ error: "Falta data.id" }, { status: 400 });
    }

    const firmaValida = validarFirmaWebhook(
      request.headers.get("x-signature"),
      request.headers.get("x-request-id"),
      String(dataId)
    );
    if (!firmaValida) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const cliente = obtenerClienteMercadoPago();
    const preapproval = await new PreApproval(cliente).get({ id: String(dataId) });

    const tiendaId = preapproval.external_reference;
    if (!tiendaId) {
      return NextResponse.json({ recibido: true });
    }

    const nuevoEstado = estadoDesdeMercadoPago(preapproval.status);
    if (!nuevoEstado) {
      return NextResponse.json({ recibido: true });
    }

    await prisma.suscripcion.upsert({
      where: { tiendaId },
      update: {
        estado: nuevoEstado,
        mpPreapprovalId: preapproval.id,
        fechaProximoCobro: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : undefined,
      },
      create: {
        tiendaId,
        estado: nuevoEstado,
        mpPreapprovalId: preapproval.id,
        fechaProximoCobro: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : undefined,
      },
    });

    return NextResponse.json({ recibido: true });
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    // 500 para que Mercado Pago reintente (útil si fue una falla pasajera
    // de nuestro lado, por ejemplo la base de datos); también deja el
    // intento visible como fallido en su panel de webhooks.
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
