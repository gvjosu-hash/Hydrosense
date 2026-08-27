import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function calcularSaldoCliente(clienteId: string): Promise<Prisma.Decimal> {
  const [ventasFiado, abonos] = await Promise.all([
    prisma.venta.aggregate({
      where: { clienteId, metodoPago: "FIADO" },
      _sum: { total: true },
    }),
    prisma.abono.aggregate({
      where: { clienteId },
      _sum: { monto: true },
    }),
  ]);

  const totalFiado = ventasFiado._sum.total ?? new Prisma.Decimal(0);
  const totalAbonado = abonos._sum.monto ?? new Prisma.Decimal(0);
  return totalFiado.sub(totalAbonado);
}
