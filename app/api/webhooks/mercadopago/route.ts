import { NextResponse } from "next/server";
import { Payment, PreApproval } from "mercadopago";
import { prisma } from "@/lib/db";
import { obtenerClienteMercadoPago } from "@/lib/mercadopago";
import { estadoDesdeMercadoPago } from "@/lib/suscripcion";
import { validarFirmaWebhook } from "@/lib/mercadopago-firma";

async function procesarPreapproval(dataId: string) {
  const cliente = obtenerClienteMercadoPago();
  const preapproval = await new PreApproval(cliente).get({ id: dataId });

  const tiendaId = preapproval.external_reference;
  if (!tiendaId) return;

  const nuevoEstado = estadoDesdeMercadoPago(preapproval.status);
  if (!nuevoEstado) return;

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
}

// Registra el cobro ya acreditado (no el estado de la suscripción, sino el
// dinero que de verdad entró) para que el panel /admin pueda sumar cuánto
// se ha acumulado para el próximo depósito. Mercado Pago propaga el
// external_reference del preapproval a cada pago generado por él.
async function procesarPago(dataId: string) {
  const cliente = obtenerClienteMercadoPago();
  const pago = await new Payment(cliente).get({ id: dataId });

  if (pago.status !== "approved") return;

  const tiendaId = pago.external_reference;
  const monto = pago.transaction_amount;
  const paymentId = pago.id;
  if (!tiendaId || monto === undefined || paymentId === undefined) return;

  const tienda = await prisma.tienda.findUnique({ where: { id: tiendaId }, select: { id: true } });
  if (!tienda) return;

  await prisma.pago.upsert({
    where: { mpPaymentId: String(paymentId) },
    update: {},
    create: {
      tiendaId,
      mpPaymentId: String(paymentId),
      monto,
      fecha: pago.date_approved ? new Date(pago.date_approved) : new Date(),
    },
  });
}

// Ruta pública: Mercado Pago llama esto directo, sin sesión de Xolo. Está
// permitida en proxy.ts junto con /api/tickets.
export async function POST(request: Request) {
  try {
    const cuerpo = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);

    const tipo = cuerpo.type ?? searchParams.get("type") ?? searchParams.get("topic");
    const dataId = cuerpo.data?.id ?? searchParams.get("data.id") ?? searchParams.get("id");

    const esPreapproval = tipo === "preapproval" || tipo === "subscription_preapproval";
    const esPago = tipo === "payment";

    if (!esPreapproval && !esPago) {
      // Otro topic que no nos interesa: no hay nada que hacer aquí.
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

    if (esPreapproval) {
      await procesarPreapproval(String(dataId));
    } else {
      await procesarPago(String(dataId));
    }

    return NextResponse.json({ recibido: true });
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    // 500 para que Mercado Pago reintente (útil si fue una falla pasajera
    // de nuestro lado, por ejemplo la base de datos); también deja el
    // intento visible como fallido en su panel de webhooks.
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
