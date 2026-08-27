import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaVenta } from "@/lib/validaciones/venta";

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const ventas = await prisma.venta.findMany({
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
      include: { items: { include: { producto: true } }, usuario: true, cliente: true },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json({ ventas });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await requerirSesion();
    const cuerpo = await request.json();
    const datos = esquemaVenta.parse(cuerpo);

    if (datos.localId) {
      const existente = await prisma.venta.findUnique({
        where: { tiendaId_localId: { tiendaId: sesion.tiendaId, localId: datos.localId } },
        include: { items: { include: { producto: true } }, cliente: true, tienda: true },
      });
      if (existente) {
        return NextResponse.json({ venta: existente });
      }
    }

    const productoIds = datos.items.map((i) => i.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds }, tiendaId: sesion.tiendaId, activo: true },
    });

    if (productos.length !== new Set(productoIds).size) {
      return NextResponse.json(
        { error: "Uno o más productos ya no están disponibles" },
        { status: 409 }
      );
    }

    const productosPorId = new Map(productos.map((p) => [p.id, p]));

    let total = new Prisma.Decimal(0);
    const itemsCalculados = datos.items.map((item) => {
      const producto = productosPorId.get(item.productoId)!;
      const cantidad = new Prisma.Decimal(item.cantidad);
      const importe = producto.precio.mul(cantidad).toDecimalPlaces(2);
      total = total.add(importe);
      return { producto, cantidad, importe };
    });

    let montoRecibido: Prisma.Decimal | null = null;
    let cambio: Prisma.Decimal | null = null;
    if (datos.metodoPago === "EFECTIVO") {
      montoRecibido = new Prisma.Decimal(datos.montoRecibido ?? 0);
      if (montoRecibido.lessThan(total)) {
        return NextResponse.json(
          { error: "El monto recibido es menor al total de la venta" },
          { status: 400 }
        );
      }
      cambio = montoRecibido.sub(total);
    } else if (datos.metodoPago === "TARJETA") {
      // La terminal física ya cobró: aquí solo se registra lo que imprimió
      // el voucher, sin volver a validar contra el total.
      montoRecibido = new Prisma.Decimal(datos.montoRecibido ?? 0);
    }

    if (datos.metodoPago === "FIADO") {
      const cliente = await prisma.cliente.findFirst({
        where: { id: datos.clienteId, tiendaId: sesion.tiendaId },
      });
      if (!cliente) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
      }
    }

    const venta = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          tiendaId: sesion.tiendaId,
          usuarioId: sesion.usuarioId,
          total,
          metodoPago: datos.metodoPago,
          montoRecibido: montoRecibido ?? undefined,
          cambio: cambio ?? undefined,
          tipoTarjeta: datos.metodoPago === "TARJETA" ? datos.tipoTarjeta : undefined,
          numeroAutorizacion:
            datos.metodoPago === "TARJETA" ? datos.numeroAutorizacion : undefined,
          clienteId: datos.metodoPago === "FIADO" ? datos.clienteId : undefined,
          localId: datos.localId,
          items: {
            create: itemsCalculados.map(({ producto, cantidad, importe }) => ({
              productoId: producto.id,
              cantidad,
              precioUnitario: producto.precio,
              importe,
            })),
          },
        },
        include: { items: { include: { producto: true } }, cliente: true, tienda: true },
      });

      for (const { producto, cantidad } of itemsCalculados) {
        await tx.producto.update({
          where: { id: producto.id },
          data: { stockActual: { decrement: cantidad } },
        });
      }

      return venta;
    });

    return NextResponse.json({ venta }, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
