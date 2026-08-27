import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaAbono } from "@/lib/validaciones/cliente";
import { calcularSaldoCliente } from "@/lib/fiado";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesion();
    const { id } = await params;

    const cliente = await prisma.cliente.findFirst({ where: { id, tiendaId: sesion.tiendaId } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const cuerpo = await request.json();
    const datos = esquemaAbono.parse(cuerpo);

    const abono = await prisma.abono.create({
      data: {
        tiendaId: sesion.tiendaId,
        clienteId: id,
        monto: datos.monto,
      },
    });

    const saldoPendiente = await calcularSaldoCliente(id);

    return NextResponse.json({ abono, saldoPendiente }, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
