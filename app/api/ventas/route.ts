import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaVenta } from "@/lib/validaciones/venta";
import { generarExcel } from "@/lib/exportar-excel";
import { generarTablaPdf } from "@/lib/exportar-pdf-tabla";
import { encabezadoDescarga, nombreArchivoExportacion } from "@/lib/nombre-exportacion";

const ETIQUETA_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  FIADO: "Fiado",
};

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const formato = searchParams.get("formato");

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

    if (formato === "xlsx" || formato === "pdf") {
      const filas = ventas.map((v) => ({
        fecha: new Date(v.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
        productos: v.items.map((i) => i.producto.nombre).join(", "),
        metodo: ETIQUETA_METODO[v.metodoPago] ?? v.metodoPago,
        atendio: v.usuario.nombre,
        cliente: v.cliente?.nombre ?? "",
        total: `$${Number(v.total).toFixed(2)}`,
      }));
      const nombreArchivo = nombreArchivoExportacion("Registro de ventas", formato);

      if (formato === "xlsx") {
        const buffer = await generarExcel([
          {
            nombre: "Ventas",
            columnas: [
              { encabezado: "Fecha", clave: "fecha", ancho: 20 },
              { encabezado: "Productos", clave: "productos", ancho: 40 },
              { encabezado: "Método", clave: "metodo", ancho: 12 },
              { encabezado: "Atendió", clave: "atendio", ancho: 18 },
              { encabezado: "Cliente (fiado)", clave: "cliente", ancho: 18 },
              { encabezado: "Total", clave: "total", ancho: 12 },
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
        titulo: "Registro de ventas",
        subtitulo: desde || hasta ? `Del ${desde?.slice(0, 10) ?? "…"} al ${hasta?.slice(0, 10) ?? "…"}` : undefined,
        columnas: [
          { encabezado: "Fecha", clave: "fecha", ancho: 130 },
          { encabezado: "Productos", clave: "productos", ancho: 280 },
          { encabezado: "Método", clave: "metodo", ancho: 70 },
          { encabezado: "Atendió", clave: "atendio", ancho: 100 },
          { encabezado: "Cliente", clave: "cliente", ancho: 100 },
          { encabezado: "Total", clave: "total", ancho: 80, alineacion: "derecha" },
        ],
        filas,
      });
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": encabezadoDescarga(nombreArchivo),
        },
      });
    }

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
