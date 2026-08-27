import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaMerma } from "@/lib/validaciones/merma";

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

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

    return NextResponse.json({ mermas });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await requerirSesion();
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
