import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface DesgloseMetodo {
  metodoPago: string;
  total: number;
  numeroVentas: number;
}

export interface ResumenPendiente {
  desde: string;
  hasta: string;
  // Solo ventas en EFECTIVO: es lo único que debe estar físicamente en la
  // caja, así que es lo único contra lo que se compara el efectivo contado.
  totalSistema: number;
  numeroVentas: number;
  totalFiado: number;
  // Con tarjeta el dinero va directo al banco, tampoco cuenta en la caja.
  totalTarjeta: number;
  desglosePorMetodo: DesgloseMetodo[];
}

export async function calcularResumenPendiente(tiendaId: string): Promise<ResumenPendiente> {
  const ultimoCorte = await prisma.corteCaja.findFirst({
    where: { tiendaId },
    orderBy: { fecha: "desc" },
  });

  const hasta = new Date();
  const desde = ultimoCorte?.fecha ?? new Date(0);

  const ventas = await prisma.venta.findMany({
    where: { tiendaId, fecha: { gt: desde, lte: hasta } },
    select: { total: true, metodoPago: true },
  });

  let totalSistema = new Prisma.Decimal(0);
  let totalFiado = new Prisma.Decimal(0);
  let totalTarjeta = new Prisma.Decimal(0);
  let numeroVentas = 0;
  const acumuladoPorMetodo = new Map<string, { total: Prisma.Decimal; numeroVentas: number }>();

  for (const venta of ventas) {
    if (venta.metodoPago === "EFECTIVO") {
      totalSistema = totalSistema.add(venta.total);
      numeroVentas += 1;
    } else if (venta.metodoPago === "FIADO") {
      totalFiado = totalFiado.add(venta.total);
    } else if (venta.metodoPago === "TARJETA") {
      totalTarjeta = totalTarjeta.add(venta.total);
    }

    const previo = acumuladoPorMetodo.get(venta.metodoPago) ?? {
      total: new Prisma.Decimal(0),
      numeroVentas: 0,
    };
    acumuladoPorMetodo.set(venta.metodoPago, {
      total: previo.total.add(venta.total),
      numeroVentas: previo.numeroVentas + 1,
    });
  }

  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    totalSistema: totalSistema.toNumber(),
    numeroVentas,
    totalFiado: totalFiado.toNumber(),
    totalTarjeta: totalTarjeta.toNumber(),
    desglosePorMetodo: Array.from(acumuladoPorMetodo.entries()).map(([metodoPago, datos]) => ({
      metodoPago,
      total: datos.total.toNumber(),
      numeroVentas: datos.numeroVentas,
    })),
  };
}
