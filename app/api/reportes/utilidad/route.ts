import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";

interface Acumulado {
  nombre: string;
  categoria: string;
  cantidad: Prisma.Decimal;
  ingreso: Prisma.Decimal;
  costoTotal: Prisma.Decimal;
  costoDesconocido: boolean;
}

export async function GET(request: Request) {
  try {
    const sesion = await requerirSesion();
    const { searchParams } = new URL(request.url);
    const hasta = searchParams.get("hasta") ? new Date(searchParams.get("hasta")!) : new Date();
    const desde = searchParams.get("desde")
      ? new Date(searchParams.get("desde")!)
      : new Date(hasta.getTime() - 29 * 24 * 60 * 60 * 1000);

    const items = await prisma.ventaItem.findMany({
      where: { venta: { tiendaId: sesion.tiendaId, fecha: { gte: desde, lte: hasta } } },
      select: {
        cantidad: true,
        importe: true,
        producto: { select: { id: true, nombre: true, categoria: true, costo: true } },
      },
    });

    const porProducto = new Map<string, Acumulado>();
    const porCategoria = new Map<string, Acumulado>();

    function acumular(mapa: Map<string, Acumulado>, clave: string, base: Acumulado) {
      const previo = mapa.get(clave);
      if (!previo) {
        mapa.set(clave, base);
        return;
      }
      previo.cantidad = previo.cantidad.add(base.cantidad);
      previo.ingreso = previo.ingreso.add(base.ingreso);
      previo.costoTotal = previo.costoTotal.add(base.costoTotal);
      previo.costoDesconocido = previo.costoDesconocido || base.costoDesconocido;
    }

    for (const item of items) {
      const costoUnitario = item.producto.costo;
      const costoDesconocido = costoUnitario === null;
      const costoTotal = costoUnitario
        ? new Prisma.Decimal(costoUnitario).mul(item.cantidad)
        : new Prisma.Decimal(0);
      const categoria = item.producto.categoria || "Sin categoría";

      acumular(porProducto, item.producto.id, {
        nombre: item.producto.nombre,
        categoria,
        cantidad: new Prisma.Decimal(item.cantidad),
        ingreso: new Prisma.Decimal(item.importe),
        costoTotal,
        costoDesconocido,
      });

      acumular(porCategoria, categoria, {
        nombre: categoria,
        categoria,
        cantidad: new Prisma.Decimal(item.cantidad),
        ingreso: new Prisma.Decimal(item.importe),
        costoTotal,
        costoDesconocido,
      });
    }

    function formatear(mapa: Map<string, Acumulado>) {
      return Array.from(mapa.values())
        .map((a) => ({
          nombre: a.nombre,
          categoria: a.categoria,
          cantidad: a.cantidad.toNumber(),
          ingreso: a.ingreso.toNumber(),
          costoTotal: a.costoTotal.toNumber(),
          utilidad: a.ingreso.sub(a.costoTotal).toNumber(),
          costoDesconocido: a.costoDesconocido,
        }))
        .sort((a, b) => b.ingreso - a.ingreso);
    }

    return NextResponse.json({
      productos: formatear(porProducto),
      categorias: formatear(porCategoria),
    });
  } catch (error) {
    return respuestaError(error);
  }
}
