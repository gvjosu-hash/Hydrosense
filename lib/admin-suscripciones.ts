import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PLANES } from "@/lib/planes";

export interface PeriodoAcumulado {
  desde: Date;
  hasta: Date;
  fechaDeposito: Date;
}

/**
 * Mercado Pago deposita en la cuenta de Xolo el día 6 de cada mes lo
 * acumulado hasta el día 5 (inclusive). Devuelve el periodo que se está
 * acumulando ahora mismo y la fecha en que le toca depositarse.
 */
export function periodoAcumuladoActual(ahora: Date = new Date()): PeriodoAcumulado {
  const dia = ahora.getDate();
  const inicio =
    dia >= 6
      ? new Date(ahora.getFullYear(), ahora.getMonth(), 6)
      : new Date(ahora.getFullYear(), ahora.getMonth() - 1, 6);
  const fechaDeposito = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 6);
  const hasta = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 5, 23, 59, 59, 999);
  return { desde: inicio, hasta, fechaDeposito };
}

export interface ResumenAdmin {
  conteoPorEstado: { estado: string; tiendas: number }[];
  conteoPorPlan: { plan: string; nombre: string; precio: number; tiendas: number }[];
  tiendasExentas: number;
  totalTiendas: number;
  ingresoMensualEstimado: number;
  periodo: PeriodoAcumulado;
  acumuladoPeriodo: number;
  numeroPagosPeriodo: number;
  ultimosPagos: { id: string; tiendaNombre: string; monto: number; fecha: Date }[];
}

export async function obtenerResumenAdmin(): Promise<ResumenAdmin> {
  const periodo = periodoAcumuladoActual();

  const [tiendas, agregadoPeriodo, ultimosPagos] = await Promise.all([
    prisma.tienda.findMany({
      select: { exentaDePago: true, suscripcion: { select: { estado: true, plan: true } } },
    }),
    prisma.pago.aggregate({
      where: { fecha: { gte: periodo.desde, lte: periodo.hasta } },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.pago.findMany({
      orderBy: { fecha: "desc" },
      take: 10,
      include: { tienda: { select: { nombre: true } } },
    }),
  ]);

  const conteo = new Map<string, number>();
  const conteoPlan = new Map<string, number>();
  let tiendasExentas = 0;
  let ingresoMensualEstimado = 0;
  for (const tienda of tiendas) {
    if (tienda.exentaDePago) {
      tiendasExentas += 1;
      continue;
    }
    const estado = tienda.suscripcion?.estado ?? "SIN_SUSCRIPCION";
    conteo.set(estado, (conteo.get(estado) ?? 0) + 1);
    if (estado === "ACTIVA" && tienda.suscripcion?.plan) {
      const plan = tienda.suscripcion.plan;
      conteoPlan.set(plan, (conteoPlan.get(plan) ?? 0) + 1);
      ingresoMensualEstimado += PLANES[plan].precio;
    }
  }

  return {
    conteoPorEstado: Array.from(conteo.entries()).map(([estado, tiendas]) => ({ estado, tiendas })),
    conteoPorPlan: Array.from(conteoPlan.entries()).map(([plan, tiendas]) => ({
      plan,
      nombre: PLANES[plan as keyof typeof PLANES].nombre,
      precio: PLANES[plan as keyof typeof PLANES].precio,
      tiendas,
    })),
    tiendasExentas,
    totalTiendas: tiendas.length,
    ingresoMensualEstimado,
    periodo,
    acumuladoPeriodo: (agregadoPeriodo._sum.monto as Prisma.Decimal | null)?.toNumber() ?? 0,
    numeroPagosPeriodo: agregadoPeriodo._count,
    ultimosPagos: ultimosPagos.map((p) => ({
      id: p.id,
      tiendaNombre: p.tienda.nombre,
      monto: p.monto.toNumber(),
      fecha: p.fecha,
    })),
  };
}
