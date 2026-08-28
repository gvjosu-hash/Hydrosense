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
  // Ventas en EFECTIVO + abonos a fiado pagados en EFECTIVO: es lo único
  // que debe estar físicamente en la caja, así que es contra lo único que
  // se compara el efectivo contado.
  totalSistema: number;
  numeroVentas: number;
  // Ventas fiadas del periodo: no es dinero que haya entrado, es deuda nueva.
  totalFiado: number;
  // Ventas con tarjeta + abonos pagados con tarjeta: el dinero va directo
  // al banco, tampoco cuenta en la caja.
  totalTarjeta: number;
  // Cuánto de totalSistema / totalTarjeta vino de abonos y no de ventas
  // nuevas (informativo, para que el desglose no confunda al tendero).
  totalAbonosEfectivo: number;
  totalAbonosTarjeta: number;
  desglosePorMetodo: DesgloseMetodo[];
}

export async function calcularResumenPendiente(tiendaId: string): Promise<ResumenPendiente> {
  const ultimoCorte = await prisma.corteCaja.findFirst({
    where: { tiendaId },
    orderBy: { fecha: "desc" },
  });

  const hasta = new Date();
  const desde = ultimoCorte?.fecha ?? new Date(0);

  const [ventas, abonos] = await Promise.all([
    prisma.venta.findMany({
      where: { tiendaId, fecha: { gt: desde, lte: hasta } },
      select: { total: true, metodoPago: true },
    }),
    prisma.abono.findMany({
      where: { tiendaId, fecha: { gt: desde, lte: hasta } },
      select: { monto: true, metodoPago: true },
    }),
  ]);

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

  // Un abono a una cuenta fiada mete dinero real a la caja (o a la
  // terminal) igual que una venta, aunque no sea una venta nueva.
  let totalAbonosEfectivo = new Prisma.Decimal(0);
  let totalAbonosTarjeta = new Prisma.Decimal(0);
  for (const abono of abonos) {
    if (abono.metodoPago === "EFECTIVO") {
      totalSistema = totalSistema.add(abono.monto);
      totalAbonosEfectivo = totalAbonosEfectivo.add(abono.monto);
    } else if (abono.metodoPago === "TARJETA") {
      totalTarjeta = totalTarjeta.add(abono.monto);
      totalAbonosTarjeta = totalAbonosTarjeta.add(abono.monto);
    }
  }

  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    totalSistema: totalSistema.toNumber(),
    numeroVentas,
    totalFiado: totalFiado.toNumber(),
    totalTarjeta: totalTarjeta.toNumber(),
    totalAbonosEfectivo: totalAbonosEfectivo.toNumber(),
    totalAbonosTarjeta: totalAbonosTarjeta.toNumber(),
    desglosePorMetodo: Array.from(acumuladoPorMetodo.entries()).map(([metodoPago, datos]) => ({
      metodoPago,
      total: datos.total.toNumber(),
      numeroVentas: datos.numeroVentas,
    })),
  };
}
