import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesion();
    const { id } = await params;

    const venta = await prisma.venta.findFirst({
      where: { id, tiendaId: sesion.tiendaId },
      include: {
        items: { include: { producto: true } },
        tienda: true,
        usuario: true,
      },
    });

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    const anchoPagina = 227; // ~80mm, ancho típico de ticket
    const margen = 14;
    const alturaLinea = 14;
    const alturaEncabezado = 90;
    const alturaPie = 90;
    const alturaPagina = alturaEncabezado + venta.items.length * alturaLinea + alturaPie;

    const pdf = await PDFDocument.create();
    const fuente = await pdf.embedFont(StandardFonts.Helvetica);
    const fuenteNegrita = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pagina = pdf.addPage([anchoPagina, alturaPagina]);

    let y = alturaPagina - margen;
    const negro = rgb(0.11, 0.11, 0.1);

    function linea(texto: string, opciones: { negrita?: boolean; tamano?: number; centrado?: boolean } = {}) {
      const tamano = opciones.tamano ?? 9;
      const f = opciones.negrita ? fuenteNegrita : fuente;
      const ancho = f.widthOfTextAtSize(texto, tamano);
      const x = opciones.centrado ? (anchoPagina - ancho) / 2 : margen;
      pagina.drawText(texto, { x, y, size: tamano, font: f, color: negro });
      y -= alturaLinea;
    }

    linea(venta.tienda.nombre, { negrita: true, tamano: 13, centrado: true });
    linea("Xolo · Punto de venta", { tamano: 8, centrado: true });
    linea("-".repeat(38));
    linea(new Date(venta.fecha).toLocaleString("es-MX"), { tamano: 8 });
    linea(`Atendió: ${venta.usuario.nombre}`, { tamano: 8 });
    linea("-".repeat(38));

    for (const item of venta.items) {
      const unidad = ETIQUETA_UNIDAD[item.producto.unidad] ?? "";
      const cantidadTxt = `${Number(item.cantidad)} ${unidad}`;
      linea(`${item.producto.nombre}`, { negrita: true, tamano: 9 });
      linea(
        `  ${cantidadTxt} x $${Number(item.precioUnitario).toFixed(2)} = $${Number(item.importe).toFixed(2)}`,
        { tamano: 9 }
      );
    }

    linea("-".repeat(38));
    linea(`TOTAL: $${Number(venta.total).toFixed(2)}`, { negrita: true, tamano: 12 });
    if (venta.montoRecibido !== null) {
      linea(`Recibido: $${Number(venta.montoRecibido).toFixed(2)}`, { tamano: 9 });
      linea(`Cambio: $${Number(venta.cambio ?? 0).toFixed(2)}`, { tamano: 9 });
    }
    linea("-".repeat(38));
    linea("¡Gracias por su compra!", { tamano: 9, centrado: true });

    const bytes = await pdf.save();
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
