import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { respuestaError } from "@/lib/api-utils";
import { generarTicketPdf } from "@/lib/generar-ticket-pdf";

// Ruta pública (sin sesión): el enlace que se manda al cliente por WhatsApp
// no tiene con qué autenticarse. El id de la venta (cuid, no adivinable)
// funciona como el token de acceso, igual que un enlace de recibo de Stripe.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        items: { include: { producto: true } },
        tienda: true,
        usuario: true,
        cliente: true,
      },
    });

    if (!venta) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const bytes = await generarTicketPdf(venta);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ticket-${venta.id}.pdf"`,
      },
    });
  } catch (error) {
    return respuestaError(error);
  }
}
