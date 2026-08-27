import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Prisma } from "@prisma/client";

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export type VentaParaTicket = Prisma.VentaGetPayload<{
  include: {
    items: { include: { producto: true } };
    tienda: true;
    usuario: true;
    cliente: true;
  };
}>;

export async function generarTicketPdf(venta: VentaParaTicket): Promise<Uint8Array> {
  const anchoPagina = 227; // ~80mm, ancho típico de ticket
  const margen = 14;
  const alturaLinea = 14;
  const alturaLogo = 46;
  const alturaEncabezado = 90 + alturaLogo;
  const alturaPie = 90;
  const lineasExtra = venta.metodoPago === "FIADO" && venta.cliente ? 1 : 0;
  const alturaPagina =
    alturaEncabezado + (venta.items.length + lineasExtra) * alturaLinea + alturaPie;

  const pdf = await PDFDocument.create();
  const fuente = await pdf.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pagina = pdf.addPage([anchoPagina, alturaPagina]);

  let y = alturaPagina - margen;
  const negro = rgb(0.11, 0.11, 0.1);

  try {
    const rutaLogo = path.join(process.cwd(), "public", "marca", "logo-icono.png");
    const bytesLogo = await readFile(rutaLogo);
    const logo = await pdf.embedPng(bytesLogo);
    const alturaDibujo = alturaLogo - 10;
    const anchoDibujo = (logo.width / logo.height) * alturaDibujo;
    pagina.drawImage(logo, {
      x: (anchoPagina - anchoDibujo) / 2,
      y: y - alturaDibujo,
      width: anchoDibujo,
      height: alturaDibujo,
    });
    y -= alturaLogo;
  } catch {
    // Si el logo no está disponible, el ticket se genera igual sin imagen.
  }

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
  if (venta.metodoPago === "FIADO" && venta.cliente) {
    linea(`Fiado a: ${venta.cliente.nombre}`, { tamano: 8, negrita: true });
  }
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
  if (venta.metodoPago === "FIADO") {
    linea("Pago pendiente (fiado)", { tamano: 9 });
  }
  if (venta.montoRecibido !== null) {
    linea(`Recibido: $${Number(venta.montoRecibido).toFixed(2)}`, { tamano: 9 });
    linea(`Cambio: $${Number(venta.cambio ?? 0).toFixed(2)}`, { tamano: 9 });
  }
  linea("-".repeat(38));
  linea("¡Gracias por su compra!", { tamano: 9, centrado: true });

  return pdf.save();
}
