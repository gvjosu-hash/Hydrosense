import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { calcularSaldoCliente } from "@/lib/fiado";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesion();
    const { id } = await params;

    const cliente = await prisma.cliente.findFirst({
      where: { id, tiendaId: sesion.tiendaId },
    });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const [ventas, abonos, saldoPendiente] = await Promise.all([
      prisma.venta.findMany({
        where: { clienteId: id, tiendaId: sesion.tiendaId, metodoPago: "FIADO" },
        include: { items: { include: { producto: true } } },
        orderBy: { fecha: "desc" },
      }),
      prisma.abono.findMany({
        where: { clienteId: id, tiendaId: sesion.tiendaId },
        orderBy: { fecha: "desc" },
      }),
      calcularSaldoCliente(id),
    ]);

    const movimientos = [
      ...ventas.map((v) => ({
        tipo: "venta" as const,
        id: v.id,
        fecha: v.fecha,
        monto: v.total,
        detalle: v.items.map((it) => `${it.producto.nombre} x${it.cantidad}`).join(", "),
      })),
      ...abonos.map((a) => ({
        tipo: "abono" as const,
        id: a.id,
        fecha: a.fecha,
        monto: a.monto,
        detalle:
          a.metodoPago === "TARJETA"
            ? `Tarjeta (${a.tipoTarjeta === "CREDITO" ? "crédito" : "débito"}) · Aut. ${a.numeroAutorizacion}`
            : "Efectivo",
      })),
    ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    return NextResponse.json({ cliente, saldoPendiente, movimientos });
  } catch (error) {
    return respuestaError(error);
  }
}
