import ExcelJS from "exceljs";

export interface ColumnaExcel {
  encabezado: string;
  clave: string;
  ancho?: number;
}

export interface HojaExcel {
  nombre: string;
  columnas: ColumnaExcel[];
  filas: Record<string, string | number | null>[];
}

export async function generarExcel(hojas: HojaExcel[]): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Xolo";
  libro.created = new Date();

  for (const hoja of hojas) {
    const worksheet = libro.addWorksheet(hoja.nombre.slice(0, 31));
    worksheet.columns = hoja.columnas.map((c) => ({
      header: c.encabezado,
      key: c.clave,
      width: c.ancho ?? 20,
    }));
    worksheet.getRow(1).font = { bold: true };
    for (const fila of hoja.filas) {
      worksheet.addRow(fila);
    }
  }

  const buffer = await libro.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
