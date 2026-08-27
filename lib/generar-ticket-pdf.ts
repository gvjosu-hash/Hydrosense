import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
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

interface Linea {
  texto: string;
  negrita?: boolean;
  tamano?: number;
  centrado?: boolean;
}

// Parte un texto en varias líneas si no cabe en el ancho disponible, para
// que un nombre de producto largo no se salga del ticket ni quede cortado.
function envolver(fuente: PDFFont, texto: string, tamano: number, anchoMax: number): string[] {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra;
    if (actual && fuente.widthOfTextAtSize(candidato, tamano) > anchoMax) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidato;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length > 0 ? lineas : [""];
}

export async function generarTicketPdf(venta: VentaParaTicket): Promise<Uint8Array> {
  // Formato angosto (~74mm) y con más aire vertical que un ticket térmico
  // apretado; la altura de la página se calcula exactamente a partir de las
  // líneas reales que se van a imprimir, así el ticket nunca sale cortado
  // sin importar cuántos productos o qué método de pago tenga.
  const anchoPagina = 210;
  const margen = 14;
  const alturaLinea = 15;
  const alturaLogo = 46;
  const anchoTexto = anchoPagina - margen * 2;

  const pdf = await PDFDocument.create();
  const fuente = await pdf.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  const separador = "-".repeat(Math.floor(anchoTexto / fuente.widthOfTextAtSize("-", 9)));

  const lineas: Linea[] = [];
  lineas.push({ texto: venta.tienda.nombre, negrita: true, tamano: 13, centrado: true });
  lineas.push({ texto: "Xolo · Punto de venta", tamano: 8, centrado: true });
  lineas.push({ texto: separador });
  lineas.push({ texto: new Date(venta.fecha).toLocaleString("es-MX"), tamano: 8 });
  lineas.push({ texto: `Atendió: ${venta.usuario.nombre}`, tamano: 8 });
  if (venta.metodoPago === "FIADO" && venta.cliente) {
    lineas.push({ texto: `Fiado a: ${venta.cliente.nombre}`, negrita: true, tamano: 8 });
  }
  lineas.push({ texto: separador });

  for (const item of venta.items) {
    const unidad = ETIQUETA_UNIDAD[item.producto.unidad] ?? "";
    const cantidadTxt = `${Number(item.cantidad)} ${unidad}`;
    for (const fragmento of envolver(fuenteNegrita, item.producto.nombre, 9, anchoTexto)) {
      lineas.push({ texto: fragmento, negrita: true, tamano: 9 });
    }
    const detalle = `  ${cantidadTxt} x $${Number(item.precioUnitario).toFixed(2)} = $${Number(item.importe).toFixed(2)}`;
    for (const fragmento of envolver(fuente, detalle, 9, anchoTexto)) {
      lineas.push({ texto: fragmento, tamano: 9 });
    }
  }

  lineas.push({ texto: separador });
  lineas.push({ texto: `TOTAL: $${Number(venta.total).toFixed(2)}`, negrita: true, tamano: 12 });

  if (venta.metodoPago === "FIADO") {
    lineas.push({ texto: "Pago pendiente (fiado)", tamano: 9 });
  }
  if (venta.metodoPago === "EFECTIVO" && venta.montoRecibido !== null) {
    lineas.push({ texto: `Recibido: $${Number(venta.montoRecibido).toFixed(2)}`, tamano: 9 });
    lineas.push({ texto: `Cambio: $${Number(venta.cambio ?? 0).toFixed(2)}`, tamano: 9 });
  }
  if (venta.metodoPago === "TARJETA") {
    const tipo = venta.tipoTarjeta === "CREDITO" ? "Crédito" : "Débito";
    lineas.push({ texto: `Tarjeta (${tipo}): $${Number(venta.montoRecibido ?? 0).toFixed(2)}`, tamano: 9 });
    lineas.push({ texto: `Autorización: ${venta.numeroAutorizacion ?? "-"}`, tamano: 9 });
  }
  lineas.push({ texto: separador });
  lineas.push({ texto: "¡Gracias por su compra!", tamano: 9, centrado: true });

  const alturaPagina = margen * 2 + alturaLogo + lineas.length * alturaLinea;
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

  for (const linea of lineas) {
    const tamano = linea.tamano ?? 9;
    const f = linea.negrita ? fuenteNegrita : fuente;
    const ancho = f.widthOfTextAtSize(linea.texto, tamano);
    const x = linea.centrado ? (anchoPagina - ancho) / 2 : margen;
    pagina.drawText(linea.texto, { x, y, size: tamano, font: f, color: negro });
    y -= alturaLinea;
  }

  return pdf.save();
}
