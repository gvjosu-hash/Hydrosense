import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirAcceso, verificarLimiteProductos } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaProducto } from "@/lib/validaciones/producto";

export async function GET(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const { searchParams } = new URL(request.url);
    const buscar = searchParams.get("buscar")?.trim();
    const incluirInactivos = searchParams.get("incluirInactivos") === "1";

    const productos = await prisma.producto.findMany({
      where: {
        tiendaId: sesion.tiendaId,
        ...(incluirInactivos ? {} : { activo: true }),
        ...(buscar
          ? {
              OR: [
                { nombre: { contains: buscar, mode: "insensitive" as const } },
                { codigoBarras: { contains: buscar, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    return NextResponse.json({ productos });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const cuerpo = await request.json();
    const datos = esquemaProducto.parse(cuerpo);
    await verificarLimiteProductos(sesion.tiendaId, 1);

    const codigoBarras = datos.codigoBarras || null;
    if (codigoBarras) {
      const existente = await prisma.producto.findFirst({
        where: { tiendaId: sesion.tiendaId, codigoBarras, activo: true },
      });
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe un producto activo con ese código de barras" },
          { status: 409 }
        );
      }
    }

    const producto = await prisma.producto.create({
      data: {
        tiendaId: sesion.tiendaId,
        nombre: datos.nombre,
        tipoVenta: datos.tipoVenta,
        unidad: datos.unidad,
        precio: datos.precio,
        costo: datos.costo ?? undefined,
        categoria: datos.categoria || null,
        fechaCaducidad: datos.fechaCaducidad ? new Date(datos.fechaCaducidad) : null,
        stockActual: datos.stockActual,
        stockMinimo: datos.stockMinimo,
        codigoBarras,
      },
    });

    return NextResponse.json({ producto }, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
