import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";

function inicioDeDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const hasta = searchParams.get("hasta") ? new Date(searchParams.get("hasta")!) : new Date();
    const desde = searchParams.get("desde")
      ? new Date(searchParams.get("desde")!)
      : new Date(hasta.getTime() - 13 * 24 * 60 * 60 * 1000);

    const ventas = await prisma.venta.findMany({
      where: { tiendaId: sesion.tiendaId, fecha: { gte: desde, lte: hasta } },
      select: { fecha: true, total: true, metodoPago: true },
    });

    const porDia = new Map<
      string,
      { totalEfectivo: Prisma.Decimal; totalFiado: Prisma.Decimal; numeroVentas: number }
    >();

    for (const venta of ventas) {
      const clave = inicioDeDia(venta.fecha);
      const previo = porDia.get(clave) ?? {
        totalEfectivo: new Prisma.Decimal(0),
        totalFiado: new Prisma.Decimal(0),
        numeroVentas: 0,
      };
      if (venta.metodoPago === "EFECTIVO") {
        previo.totalEfectivo = previo.totalEfectivo.add(venta.total);
      } else {
        previo.totalFiado = previo.totalFiado.add(venta.total);
      }
      previo.numeroVentas += 1;
      porDia.set(clave, previo);
    }

    const dias = Array.from(porDia.entries())
      .map(([fecha, datos]) => ({
        fecha,
        numeroVentas: datos.numeroVentas,
        totalEfectivo: datos.totalEfectivo.toNumber(),
        totalFiado: datos.totalFiado.toNumber(),
        total: datos.totalEfectivo.add(datos.totalFiado).toNumber(),
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    return NextResponse.json({ dias });
  } catch (error) {
    return respuestaError(error);
  }
}
