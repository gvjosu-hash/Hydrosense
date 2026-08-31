import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface ColumnaPdf {
  encabezado: string;
  clave: string;
  ancho: number;
  alineacion?: "izquierda" | "derecha";
}

export interface DatosTablaPdf {
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaPdf[];
  filas: Record<string, string>[];
}

const ANCHO_PAGINA = 792; // Carta horizontal (11in)
const ALTO_PAGINA = 612; // 8.5in
const MARGEN = 36;
const ALTURA_FILA = 18;

function truncar(fuente: PDFFont, texto: string, tamano: number, anchoMax: number): string {
  if (fuente.widthOfTextAtSize(texto, tamano) <= anchoMax) return texto;
  let corto = texto;
  while (corto.length > 1 && fuente.widthOfTextAtSize(`${corto}…`, tamano) > anchoMax) {
    corto = corto.slice(0, -1);
  }
  return `${corto}…`;
}

async function crearDocumentoBase() {
  const pdf = await PDFDocument.create();
  const fuente = await pdf.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const negro = rgb(0.11, 0.11, 0.1);
  const gris = rgb(0.45, 0.43, 0.4);
  const acento = rgb(0.047, 0.29, 0.247);
  const fondoEncabezado = rgb(0.91, 0.93, 0.91);

  let logo: PDFImage | null = null;
  try {
    const bytesLogo = await readFile(path.join(process.cwd(), "public", "marca", "logo-icono.png"));
    logo = await pdf.embedPng(bytesLogo);
  } catch {
    // Sin logo, el PDF se genera igual.
  }

  return { pdf, fuente, fuenteNegrita, negro, gris, acento, fondoEncabezado, logo };
}

function crearRenderizadorTabla(base: Awaited<ReturnType<typeof crearDocumentoBase>>) {
  const { pdf, fuente, fuenteNegrita, negro, gris, acento, fondoEncabezado, logo } = base;

  let pagina!: PDFPage;
  let y!: number;
  let columnasActuales: ColumnaPdf[] = [];

  function nuevaPagina(titulo: string, subtitulo?: string) {
    pagina = pdf.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    y = ALTO_PAGINA - MARGEN;

    if (logo) {
      const alturaLogo = 24;
      const anchoLogo = (logo.width / logo.height) * alturaLogo;
      pagina.drawImage(logo, { x: MARGEN, y: y - alturaLogo + 6, width: anchoLogo, height: alturaLogo });
    }

    pagina.drawText(titulo, {
      x: MARGEN + (logo ? 34 : 0),
      y: y - 12,
      size: 16,
      font: fuenteNegrita,
      color: acento,
    });
    if (subtitulo) {
      pagina.drawText(subtitulo, {
        x: MARGEN + (logo ? 34 : 0),
        y: y - 28,
        size: 9,
        font: fuente,
        color: gris,
      });
    }
    const fechaTexto = `Generado: ${new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}`;
    const anchoFecha = fuente.widthOfTextAtSize(fechaTexto, 8);
    pagina.drawText(fechaTexto, { x: ANCHO_PAGINA - MARGEN - anchoFecha, y: y - 12, size: 8, font: fuente, color: gris });

    y -= 48;
    dibujarEncabezadoTabla();
  }

  function dibujarEncabezadoTabla() {
    pagina.drawRectangle({
      x: MARGEN,
      y: y - ALTURA_FILA + 4,
      width: ANCHO_PAGINA - MARGEN * 2,
      height: ALTURA_FILA,
      color: fondoEncabezado,
    });
    let x = MARGEN + 4;
    for (const columna of columnasActuales) {
      const texto = truncar(fuenteNegrita, columna.encabezado, 9, columna.ancho - 8);
      const anchoTexto = fuenteNegrita.widthOfTextAtSize(texto, 9);
      const tx = columna.alineacion === "derecha" ? x + columna.ancho - 8 - anchoTexto : x;
      pagina.drawText(texto, { x: tx, y, size: 9, font: fuenteNegrita, color: negro });
      x += columna.ancho;
    }
    y -= ALTURA_FILA;
  }

  function renderizarTabla({ titulo, subtitulo, columnas, filas }: DatosTablaPdf) {
    columnasActuales = columnas;
    nuevaPagina(titulo, subtitulo);

    for (const fila of filas) {
      if (y < MARGEN + ALTURA_FILA) {
        nuevaPagina(titulo, subtitulo);
      }
      let x = MARGEN + 4;
      for (const columna of columnas) {
        const valor = fila[columna.clave] ?? "";
        const texto = truncar(fuente, valor, 9, columna.ancho - 8);
        const anchoTexto = fuente.widthOfTextAtSize(texto, 9);
        const tx = columna.alineacion === "derecha" ? x + columna.ancho - 8 - anchoTexto : x;
        pagina.drawText(texto, { x: tx, y, size: 9, font: fuente, color: negro });
        x += columna.ancho;
      }
      y -= ALTURA_FILA;
    }

    if (filas.length === 0) {
      pagina.drawText("Sin datos para mostrar.", { x: MARGEN + 4, y, size: 9, font: fuente, color: gris });
    }
  }

  return { renderizarTabla };
}

export async function generarTablaPdf(datos: DatosTablaPdf): Promise<Uint8Array> {
  const base = await crearDocumentoBase();
  const { renderizarTabla } = crearRenderizadorTabla(base);
  renderizarTabla(datos);
  return base.pdf.save();
}

export async function generarTablaPdfSecciones(secciones: DatosTablaPdf[]): Promise<Uint8Array> {
  const base = await crearDocumentoBase();
  const { renderizarTabla } = crearRenderizadorTabla(base);
  for (const seccion of secciones) {
    renderizarTabla(seccion);
  }
  return base.pdf.save();
}
