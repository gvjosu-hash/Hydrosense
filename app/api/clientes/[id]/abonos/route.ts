import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirAcceso } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaAbono } from "@/lib/validaciones/cliente";
import { calcularSaldoCliente } from "@/lib/fiado";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAcceso();
    const { id } = await params;

    const cliente = await prisma.cliente.findFirst({ where: { id, tiendaId: sesion.tiendaId } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const cuerpo = await request.json();
    const datos = esquemaAbono.parse(cuerpo);

    // El saldo nunca debe quedar en negativo: no se puede abonar más de lo
    // que el cliente debe. Se bloquea la fila del cliente dentro de la
    // transacción para que dos abonos simultáneos no lean el mismo saldo
    // "viejo" y entre los dos dejen la cuenta en negativo.
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM clientes WHERE id = ${id} FOR UPDATE`;

      const saldoActual = await calcularSaldoCliente(id, tx);
      if (saldoActual.lessThanOrEqualTo(0)) {
        throw new Error("Este cliente no tiene saldo pendiente");
      }
      if (datos.monto > saldoActual.toNumber()) {
        throw new Error(`El abono no puede ser mayor a lo que debe ($${saldoActual.toFixed(2)})`);
      }

      const abono = await tx.abono.create({
        data: {
          tiendaId: sesion.tiendaId,
          clienteId: id,
          monto: datos.monto,
          metodoPago: datos.metodoPago,
          tipoTarjeta: datos.metodoPago === "TARJETA" ? datos.tipoTarjeta : undefined,
          numeroAutorizacion:
            datos.metodoPago === "TARJETA" ? datos.numeroAutorizacion : undefined,
        },
      });

      const saldoPendiente = await calcularSaldoCliente(id, tx);
      return { abono, saldoPendiente };
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
