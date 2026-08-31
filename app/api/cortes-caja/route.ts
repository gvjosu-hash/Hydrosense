import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirAcceso } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { calcularResumenPendiente } from "@/lib/cortes-caja";

export async function GET(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const cortes = await prisma.corteCaja.findMany({
      where: {
        tiendaId: sesion.tiendaId,
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json({ cortes });
  } catch (error) {
    return respuestaError(error);
  }
}

const esquemaCorte = z.object({
  totalCapturado: z.coerce.number().min(0, "Captura el efectivo contado"),
});

export async function POST(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const cuerpo = await request.json();
    const datos = esquemaCorte.parse(cuerpo);

    const resumen = await calcularResumenPendiente(sesion.tiendaId);
    const diferencia = datos.totalCapturado - resumen.totalSistema;

    const corte = await prisma.corteCaja.create({
      data: {
        tiendaId: sesion.tiendaId,
        totalSistema: resumen.totalSistema,
        totalCapturado: datos.totalCapturado,
        diferencia,
        desglosePorMetodo: resumen.desglosePorMetodo as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ corte, resumen }, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
