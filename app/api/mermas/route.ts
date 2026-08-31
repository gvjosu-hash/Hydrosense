import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirAcceso } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaMerma } from "@/lib/validaciones/merma";
import { generarExcel } from "@/lib/exportar-excel";
import { generarTablaPdfSecciones } from "@/lib/exportar-pdf-tabla";
import { encabezadoDescarga, nombreArchivoExportacion } from "@/lib/nombre-exportacion";

const ETIQUETA_UNIDAD: Record<string, string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

const ETIQUETA_MOTIVO: Record<string, string> = {
  CADUCIDAD: "Caducidad",
  DANO: "Daño",
  ROBO: "Robo",
  OTRO: "Otro",
};

export async function GET(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const formato = searchParams.get("formato");

    const mermas = await prisma.merma.findMany({
      where: {
        tiendaId: sesion.tiendaId,
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      include: { producto: true },
      orderBy: { fecha: "desc" },
    });

    if (formato === "xlsx" || formato === "pdf") {
      const productosCaducidad = await prisma.producto.findMany({
        where: { tiendaId: sesion.tiendaId, activo: true, fechaCaducidad: { not: null } },
        orderBy: { fechaCaducidad: "asc" },
      });

      const filasMermas = mermas.map((m) => ({
        fecha: new Date(m.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
        producto: m.producto.nombre,
        cantidad: `${Number(m.cantidad)} ${ETIQUETA_UNIDAD[m.producto.unidad] ?? m.producto.unidad}`,
        motivo: ETIQUETA_MOTIVO[m.motivo] ?? m.motivo,
        nota: m.nota ?? "",
      }));

      const filasCaducidad = productosCaducidad.map((p) => ({
        producto: p.nombre,
        caduca: new Date(p.fechaCaducidad!).toLocaleDateString("es-MX"),
        stock: `${Number(p.stockActual)} ${ETIQUETA_UNIDAD[p.unidad] ?? p.unidad}`,
      }));

      const nombreArchivo = nombreArchivoExportacion("Mermas y caducidades", formato);

      if (formato === "xlsx") {
        const buffer = await generarExcel([
          {
            nombre: "Historial de mermas",
            columnas: [
              { encabezado: "Fecha", clave: "fecha", ancho: 20 },
              { encabezado: "Producto", clave: "producto", ancho: 30 },
              { encabezado: "Cantidad", clave: "cantidad", ancho: 14 },
              { encabezado: "Motivo", clave: "motivo", ancho: 14 },
              { encabezado: "Nota", clave: "nota", ancho: 30 },
            ],
            filas: filasMermas,
          },
          {
            nombre: "Próximas a caducar",
            columnas: [
              { encabezado: "Producto", clave: "producto", ancho: 30 },
              { encabezado: "Caduca", clave: "caduca", ancho: 16 },
              { encabezado: "Stock actual", clave: "stock", ancho: 16 },
            ],
            filas: filasCaducidad,
          },
        ]);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": encabezadoDescarga(nombreArchivo),
          },
        });
      }

      const bytes = await generarTablaPdfSecciones([
        {
          titulo: "Historial de mermas",
          columnas: [
            { encabezado: "Fecha", clave: "fecha", ancho: 130 },
            { encabezado: "Producto", clave: "producto", ancho: 220 },
            { encabezado: "Cantidad", clave: "cantidad", ancho: 100, alineacion: "derecha" },
            { encabezado: "Motivo", clave: "motivo", ancho: 100 },
            { encabezado: "Nota", clave: "nota", ancho: 170 },
          ],
          filas: filasMermas,
        },
        {
          titulo: "Próximas a caducar",
          columnas: [
            { encabezado: "Producto", clave: "producto", ancho: 300 },
            { encabezado: "Caduca", clave: "caduca", ancho: 130 },
            { encabezado: "Stock actual", clave: "stock", ancho: 130, alineacion: "derecha" },
          ],
          filas: filasCaducidad,
        },
      ]);
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": encabezadoDescarga(nombreArchivo),
        },
      });
    }

    return NextResponse.json({ mermas });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const cuerpo = await request.json();
    const datos = esquemaMerma.parse(cuerpo);

    const producto = await prisma.producto.findFirst({
      where: { id: datos.productoId, tiendaId: sesion.tiendaId },
    });
    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const cantidad = new Prisma.Decimal(datos.cantidad);
    if (cantidad.greaterThan(producto.stockActual)) {
      return NextResponse.json(
        { error: "La cantidad supera la existencia actual del producto" },
        { status: 400 }
      );
    }

    const [merma] = await prisma.$transaction([
      prisma.merma.create({
        data: {
          tiendaId: sesion.tiendaId,
          productoId: datos.productoId,
          cantidad,
          motivo: datos.motivo,
          nota: datos.nota || null,
        },
        include: { producto: true },
      }),
      prisma.producto.update({
        where: { id: datos.productoId },
        data: { stockActual: { decrement: cantidad } },
      }),
    ]);

    return NextResponse.json({ merma }, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
