import ExcelJS from "exceljs";
import { Readable } from "stream";
import { esquemaProducto, type DatosProducto } from "@/lib/validaciones/producto";

export const MAX_FILAS_IMPORTACION = 5000;

export interface FilaImportada {
  fila: number;
  datos?: DatosProducto;
  error?: string;
}

const ALIAS_ENCABEZADO: Record<string, keyof DatosProducto> = {
  nombre: "nombre",
  tipodeventa: "tipoVenta",
  tipoventa: "tipoVenta",
  unidad: "unidad",
  precio: "precio",
  costo: "costo",
  categoria: "categoria",
  fechadecaducidad: "fechaCaducidad",
  fechacaducidad: "fechaCaducidad",
  caducidad: "fechaCaducidad",
  stockactual: "stockActual",
  stock: "stockActual",
  existencia: "stockActual",
  stockminimo: "stockMinimo",
  minimo: "stockMinimo",
  codigodebarras: "codigoBarras",
  codigobarras: "codigoBarras",
};

function normalizarEncabezado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function valorCelda(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "object" && "text" in valor) return String(valor.text ?? "");
  if (typeof valor === "object" && "result" in valor) return String(valor.result ?? "");
  return String(valor).trim();
}

export async function leerArchivoProductos(
  buffer: Buffer,
  nombreArchivo: string
): Promise<FilaImportada[]> {
  const esCsv = nombreArchivo.toLowerCase().endsWith(".csv");
  const libro = new ExcelJS.Workbook();
  let hoja: ExcelJS.Worksheet | undefined;

  if (esCsv) {
    hoja = await libro.csv.read(Readable.from(buffer));
  } else {
    await libro.xlsx.load(buffer as unknown as Parameters<typeof libro.xlsx.load>[0]);
    hoja = libro.worksheets[0];
  }
  if (!hoja) return [];

  const columnas: (keyof DatosProducto | null)[] = [];
  hoja.getRow(1).eachCell({ includeEmpty: true }, (celda, numeroColumna) => {
    const encabezado = normalizarEncabezado(valorCelda(celda.value));
    columnas[numeroColumna] = ALIAS_ENCABEZADO[encabezado] ?? null;
  });

  const resultado: FilaImportada[] = [];
  for (let numeroFila = 2; numeroFila <= hoja.rowCount; numeroFila++) {
    const fila = hoja.getRow(numeroFila);
    if (fila.actualCellCount === 0) continue;

    const crudo: Record<string, string> = {};
    columnas.forEach((clave, numeroColumna) => {
      if (!clave) return;
      crudo[clave] = valorCelda(fila.getCell(numeroColumna).value);
    });

    if (Object.values(crudo).every((v) => v === "")) continue;

    const normalizado = {
      ...crudo,
      tipoVenta: crudo.tipoVenta?.toUpperCase().trim(),
      unidad: crudo.unidad?.toUpperCase().trim(),
    };

    const parseo = esquemaProducto.safeParse(normalizado);
    if (!parseo.success) {
      resultado.push({
        fila: numeroFila - 1,
        error: parseo.error.issues.map((i) => i.message).join("; "),
      });
    } else {
      resultado.push({ fila: numeroFila - 1, datos: parseo.data });
    }
  }

  return resultado;
}
