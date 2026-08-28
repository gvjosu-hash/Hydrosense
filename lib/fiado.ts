import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type ClientePrisma = typeof prisma | Prisma.TransactionClient;

export async function calcularSaldoCliente(
  clienteId: string,
  cliente: ClientePrisma = prisma
): Promise<Prisma.Decimal> {
  const [ventasFiado, abonos] = await Promise.all([
    cliente.venta.aggregate({
      where: { clienteId, metodoPago: "FIADO" },
      _sum: { total: true },
    }),
    cliente.abono.aggregate({
      where: { clienteId },
      _sum: { monto: true },
    }),
  ]);

  const totalFiado = ventasFiado._sum.total ?? new Prisma.Decimal(0);
  const totalAbonado = abonos._sum.monto ?? new Prisma.Decimal(0);
  return totalFiado.sub(totalAbonado);
}
