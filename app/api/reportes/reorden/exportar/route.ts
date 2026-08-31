import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { generarExcel } from "@/lib/exportar-excel";
import { generarTablaPdf } from "@/lib/exportar-pdf-tabla";
import { encabezadoDescarga, nombreArchivoExportacion } from "@/lib/nombre-exportacion";

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const formato = searchParams.get("formato");
    if (formato !== "xlsx" && formato !== "pdf") {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const productos = await prisma.producto.findMany({
      where: { tiendaId: sesion.tiendaId, activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    const paraReordenar = productos
      .filter((p) => Number(p.stockActual) <= Number(p.stockMinimo) && Number(p.stockMinimo) > 0)
      .sort((a, b) => {
        const urgenciaA = Number(a.stockActual) - Number(a.stockMinimo);
        const urgenciaB = Number(b.stockActual) - Number(b.stockMinimo);
        return urgenciaA - urgenciaB;
      });

    const filas = paraReordenar.map((p) => {
      const stockActual = Number(p.stockActual);
      const stockMinimo = Number(p.stockMinimo);
      const sugerido = Math.max(stockMinimo * 2 - stockActual, stockMinimo);
      const unidad = ETIQUETA_UNIDAD[p.unidad] ?? p.unidad;
      return {
        nombre: p.nombre,
        existencia: `${stockActual} ${unidad}`,
        minimo: `${stockMinimo} ${unidad}`,
        sugerido: `${sugerido} ${unidad}`,
        estado: stockActual <= 0 ? "Agotado" : "Bajo mínimo",
      };
    });

    const nombreArchivo = nombreArchivoExportacion("Reorden", formato);

    if (formato === "xlsx") {
      const buffer = await generarExcel([
        {
          nombre: "Reorden",
          columnas: [
            { encabezado: "Producto", clave: "nombre", ancho: 30 },
            { encabezado: "Existencia", clave: "existencia", ancho: 14 },
            { encabezado: "Mínimo", clave: "minimo", ancho: 14 },
            { encabezado: "Sugerido a pedir", clave: "sugerido", ancho: 16 },
            { encabezado: "Estado", clave: "estado", ancho: 14 },
          ],
          filas,
        },
      ]);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": encabezadoDescarga(nombreArchivo),
        },
      });
    }

    const bytes = await generarTablaPdf({
      titulo: "Reorden",
      subtitulo: "Productos en o por debajo del mínimo definido en Productos.",
      columnas: [
        { encabezado: "Producto", clave: "nombre", ancho: 220 },
        { encabezado: "Existencia", clave: "existencia", ancho: 120, alineacion: "derecha" },
        { encabezado: "Mínimo", clave: "minimo", ancho: 110, alineacion: "derecha" },
        { encabezado: "Sugerido a pedir", clave: "sugerido", ancho: 130, alineacion: "derecha" },
        { encabezado: "Estado", clave: "estado", ancho: 110 },
      ],
      filas,
    });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": encabezadoDescarga(nombreArchivo),
      },
    });
  } catch (error) {
    return respuestaError(error);
  }
}
