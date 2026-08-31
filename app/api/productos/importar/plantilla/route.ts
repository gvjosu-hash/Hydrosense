import { NextResponse } from "next/server";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { generarExcel } from "@/lib/exportar-excel";
import { encabezadoDescarga, nombreArchivoExportacion } from "@/lib/nombre-exportacion";

export async function GET() {
  try {
    await requerirSesion();

    const buffer = await generarExcel([
      {
        nombre: "Productos",
        columnas: [
          { encabezado: "Nombre", clave: "nombre", ancho: 30 },
          { encabezado: "Tipo de venta", clave: "tipoVenta", ancho: 14 },
          { encabezado: "Unidad", clave: "unidad", ancho: 10 },
          { encabezado: "Precio", clave: "precio", ancho: 12 },
          { encabezado: "Costo", clave: "costo", ancho: 12 },
          { encabezado: "Categoría", clave: "categoria", ancho: 16 },
          { encabezado: "Fecha de caducidad", clave: "fechaCaducidad", ancho: 18 },
          { encabezado: "Stock actual", clave: "stockActual", ancho: 14 },
          { encabezado: "Stock mínimo", clave: "stockMinimo", ancho: 14 },
          { encabezado: "Código de barras", clave: "codigoBarras", ancho: 18 },
        ],
        filas: [
          {
            nombre: "Coca-Cola 600 ml",
            tipoVenta: "PIEZA",
            unidad: "PIEZA",
            precio: 25,
            costo: 18,
            categoria: "Bebidas",
            fechaCaducidad: "2026-12-31",
            stockActual: 50,
            stockMinimo: 10,
            codigoBarras: "7501055300011",
          },
          {
            nombre: "Frijol a granel",
            tipoVenta: "GRANEL",
            unidad: "KG",
            precio: 32,
            costo: null,
            categoria: "Abarrotes",
            fechaCaducidad: null,
            stockActual: 15,
            stockMinimo: 3,
            codigoBarras: null,
          },
        ],
      },
    ]);

    const nombreArchivo = nombreArchivoExportacion("Plantilla de productos", "xlsx");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encabezadoDescarga(nombreArchivo),
      },
    });
  } catch (error) {
    return respuestaError(error);
  }
}
