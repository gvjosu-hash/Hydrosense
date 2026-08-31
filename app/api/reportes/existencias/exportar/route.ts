import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirAcceso } from "@/lib/tenant";
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
    const sesion = await requerirAcceso();
    const { searchParams } = new URL(request.url);
    const formato = searchParams.get("formato");
    if (formato !== "xlsx" && formato !== "pdf") {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const productos = await prisma.producto.findMany({
      where: { tiendaId: sesion.tiendaId, activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    const filas = productos.map((p) => {
      const costo = p.costo === null ? null : Number(p.costo);
      const stock = Number(p.stockActual);
      return {
        nombre: p.nombre,
        categoria: p.categoria ?? "Sin categoría",
        stock: `${stock} ${ETIQUETA_UNIDAD[p.unidad] ?? p.unidad}`,
        costo: costo === null ? "Sin costo" : `$${costo.toFixed(2)}`,
        valor: costo === null ? "—" : `$${(stock * costo).toFixed(2)}`,
      };
    });

    const nombreArchivo = nombreArchivoExportacion("Existencias", formato);

    if (formato === "xlsx") {
      const buffer = await generarExcel([
        {
          nombre: "Existencias",
          columnas: [
            { encabezado: "Producto", clave: "nombre", ancho: 30 },
            { encabezado: "Categoría", clave: "categoria", ancho: 18 },
            { encabezado: "Stock actual", clave: "stock", ancho: 14 },
            { encabezado: "Costo", clave: "costo", ancho: 12 },
            { encabezado: "Valor", clave: "valor", ancho: 14 },
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
      titulo: "Existencias (stock actual)",
      columnas: [
        { encabezado: "Producto", clave: "nombre", ancho: 240 },
        { encabezado: "Categoría", clave: "categoria", ancho: 140 },
        { encabezado: "Stock actual", clave: "stock", ancho: 110, alineacion: "derecha" },
        { encabezado: "Costo", clave: "costo", ancho: 100, alineacion: "derecha" },
        { encabezado: "Valor", clave: "valor", ancho: 100, alineacion: "derecha" },
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
