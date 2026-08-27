import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaCliente } from "@/lib/validaciones/cliente";

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const buscar = searchParams.get("buscar")?.trim();

    const [clientes, sumasFiado, sumasAbonos] = await Promise.all([
      prisma.cliente.findMany({
        where: {
          tiendaId: sesion.tiendaId,
          ...(buscar
            ? {
                OR: [
                  { nombre: { contains: buscar, mode: "insensitive" as const } },
                  { whatsapp: { contains: buscar, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        orderBy: { nombre: "asc" },
      }),
      prisma.venta.groupBy({
        by: ["clienteId"],
        where: { tiendaId: sesion.tiendaId, metodoPago: "FIADO", clienteId: { not: null } },
        _sum: { total: true },
      }),
      prisma.abono.groupBy({
        by: ["clienteId"],
        where: { tiendaId: sesion.tiendaId },
        _sum: { monto: true },
      }),
    ]);

    const fiadoPorCliente = new Map(
      sumasFiado.map((s) => [s.clienteId as string, s._sum.total ?? new Prisma.Decimal(0)])
    );
    const abonadoPorCliente = new Map(
      sumasAbonos.map((s) => [s.clienteId, s._sum.monto ?? new Prisma.Decimal(0)])
    );

    const clientesConSaldo = clientes.map((cliente) => {
      const fiado = fiadoPorCliente.get(cliente.id) ?? new Prisma.Decimal(0);
      const abonado = abonadoPorCliente.get(cliente.id) ?? new Prisma.Decimal(0);
      return { ...cliente, saldoPendiente: fiado.sub(abonado) };
    });

    return NextResponse.json({ clientes: clientesConSaldo });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await requerirSesion();
    const cuerpo = await request.json();
    const datos = esquemaCliente.parse(cuerpo);

    const cliente = await prisma.cliente.create({
      data: {
        tiendaId: sesion.tiendaId,
        nombre: datos.nombre,
        whatsapp: datos.whatsapp || null,
      },
    });

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
