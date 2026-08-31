import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirAcceso } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { generarExcel } from "@/lib/exportar-excel";
import { generarTablaPdf } from "@/lib/exportar-pdf-tabla";
import { encabezadoDescarga, nombreArchivoExportacion } from "@/lib/nombre-exportacion";

interface Acumulado {
  nombre: string;
  categoria: string;
  cantidad: Prisma.Decimal;
  ingreso: Prisma.Decimal;
  costoTotal: Prisma.Decimal;
  costoDesconocido: boolean;
}

export async function GET(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const { searchParams } = new URL(request.url);
    const hasta = searchParams.get("hasta") ? new Date(searchParams.get("hasta")!) : new Date();
    const desde = searchParams.get("desde")
      ? new Date(searchParams.get("desde")!)
      : new Date(hasta.getTime() - 29 * 24 * 60 * 60 * 1000);

    const items = await prisma.ventaItem.findMany({
      where: { venta: { tiendaId: sesion.tiendaId, fecha: { gte: desde, lte: hasta } } },
      select: {
        cantidad: true,
        importe: true,
        producto: { select: { id: true, nombre: true, categoria: true, costo: true } },
      },
    });

    const porProducto = new Map<string, Acumulado>();
    const porCategoria = new Map<string, Acumulado>();

    function acumular(mapa: Map<string, Acumulado>, clave: string, base: Acumulado) {
      const previo = mapa.get(clave);
      if (!previo) {
        mapa.set(clave, base);
        return;
      }
      previo.cantidad = previo.cantidad.add(base.cantidad);
      previo.ingreso = previo.ingreso.add(base.ingreso);
      previo.costoTotal = previo.costoTotal.add(base.costoTotal);
      previo.costoDesconocido = previo.costoDesconocido || base.costoDesconocido;
    }

    for (const item of items) {
      const costoUnitario = item.producto.costo;
      const costoDesconocido = costoUnitario === null;
      const costoTotal = costoUnitario
        ? new Prisma.Decimal(costoUnitario).mul(item.cantidad)
        : new Prisma.Decimal(0);
      const categoria = item.producto.categoria || "Sin categoría";

      acumular(porProducto, item.producto.id, {
        nombre: item.producto.nombre,
        categoria,
        cantidad: new Prisma.Decimal(item.cantidad),
        ingreso: new Prisma.Decimal(item.importe),
        costoTotal,
        costoDesconocido,
      });

      acumular(porCategoria, categoria, {
        nombre: categoria,
        categoria,
        cantidad: new Prisma.Decimal(item.cantidad),
        ingreso: new Prisma.Decimal(item.importe),
        costoTotal,
        costoDesconocido,
      });
    }

    function formatear(mapa: Map<string, Acumulado>) {
      return Array.from(mapa.values())
        .map((a) => ({
          nombre: a.nombre,
          categoria: a.categoria,
          cantidad: a.cantidad.toNumber(),
          ingreso: a.ingreso.toNumber(),
          costoTotal: a.costoTotal.toNumber(),
          utilidad: a.ingreso.sub(a.costoTotal).toNumber(),
          costoDesconocido: a.costoDesconocido,
        }))
        .sort((a, b) => b.ingreso - a.ingreso);
    }

    const productos = formatear(porProducto);
    const categorias = formatear(porCategoria);

    const formato = searchParams.get("formato");
    if (formato === "xlsx" || formato === "pdf") {
      const agrupar = searchParams.get("agrupar") === "categoria";
      const datos = agrupar ? categorias : productos;
      const nombreColumna = agrupar ? "Categoría" : "Producto";
      const filas = datos.map((d) => ({
        nombre: d.nombre,
        cantidad: String(d.cantidad),
        ingreso: `$${d.ingreso.toFixed(2)}`,
        costo: d.costoDesconocido ? "Parcial" : `$${d.costoTotal.toFixed(2)}`,
        utilidad: `$${d.utilidad.toFixed(2)}`,
      }));
      const nombreArchivo = nombreArchivoExportacion("Utilidad bruta", formato);
      const subtitulo = `Del ${desde.toISOString().slice(0, 10)} al ${hasta.toISOString().slice(0, 10)}`;

      if (formato === "xlsx") {
        const buffer = await generarExcel([
          {
            nombre: "Utilidad bruta",
            columnas: [
              { encabezado: nombreColumna, clave: "nombre", ancho: 30 },
              { encabezado: "Cantidad", clave: "cantidad", ancho: 12 },
              { encabezado: "Ingreso", clave: "ingreso", ancho: 14 },
              { encabezado: "Costo", clave: "costo", ancho: 14 },
              { encabezado: "Utilidad", clave: "utilidad", ancho: 14 },
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
        titulo: "Utilidad bruta",
        subtitulo,
        columnas: [
          { encabezado: nombreColumna, clave: "nombre", ancho: 250 },
          { encabezado: "Cantidad", clave: "cantidad", ancho: 100, alineacion: "derecha" },
          { encabezado: "Ingreso", clave: "ingreso", ancho: 120, alineacion: "derecha" },
          { encabezado: "Costo", clave: "costo", ancho: 120, alineacion: "derecha" },
          { encabezado: "Utilidad", clave: "utilidad", ancho: 120, alineacion: "derecha" },
        ],
        filas,
      });
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": encabezadoDescarga(nombreArchivo),
        },
      });
    }

    return NextResponse.json({ productos, categorias });
  } catch (error) {
    return respuestaError(error);
  }
}
