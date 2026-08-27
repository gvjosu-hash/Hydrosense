import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaProducto } from "@/lib/validaciones/producto";

const esquemaEdicionRapida = z
  .object({
    activo: z.boolean().optional(),
    precio: z.coerce.number().min(0, "El precio no puede ser negativo").optional(),
    costo: z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
    categoria: z.string().trim().optional(),
    fechaCaducidad: z.string().trim().optional(),
    stockActual: z.coerce.number().min(0, "El stock no puede ser negativo").optional(),
    stockMinimo: z.coerce.number().min(0, "El stock mínimo no puede ser negativo").optional(),
  })
  .refine(
    (datos) =>
      datos.activo !== undefined ||
      datos.precio !== undefined ||
      datos.costo !== undefined ||
      datos.categoria !== undefined ||
      datos.fechaCaducidad !== undefined ||
      datos.stockActual !== undefined ||
      datos.stockMinimo !== undefined,
    { message: "No hay nada que actualizar" }
  );

async function buscarProductoDeLaTienda(id: string, tiendaId: string) {
  const producto = await prisma.producto.findFirst({ where: { id, tiendaId } });
  if (!producto) throw new Error("Producto no encontrado");
  return producto;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesion();
    const { id } = await params;
    await buscarProductoDeLaTienda(id, sesion.tiendaId);

    const cuerpo = await request.json();
    const datos = esquemaProducto.parse(cuerpo);
    const codigoBarras = datos.codigoBarras || null;

    if (codigoBarras) {
      const existente = await prisma.producto.findFirst({
        where: { tiendaId: sesion.tiendaId, codigoBarras, activo: true, NOT: { id } },
      });
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe otro producto activo con ese código de barras" },
          { status: 409 }
        );
      }
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre: datos.nombre,
        tipoVenta: datos.tipoVenta,
        unidad: datos.unidad,
        precio: datos.precio,
        costo: datos.costo ?? null,
        categoria: datos.categoria || null,
        fechaCaducidad: datos.fechaCaducidad ? new Date(datos.fechaCaducidad) : null,
        stockActual: datos.stockActual,
        stockMinimo: datos.stockMinimo,
        codigoBarras,
      },
    });

    return NextResponse.json({ producto });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesion();
    const { id } = await params;
    await buscarProductoDeLaTienda(id, sesion.tiendaId);

    const cuerpo = await request.json();
    const datos = esquemaEdicionRapida.parse(cuerpo);

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
        ...(datos.precio !== undefined ? { precio: datos.precio } : {}),
        ...(datos.costo !== undefined ? { costo: datos.costo } : {}),
        ...(datos.categoria !== undefined ? { categoria: datos.categoria || null } : {}),
        ...(datos.fechaCaducidad !== undefined
          ? { fechaCaducidad: datos.fechaCaducidad ? new Date(datos.fechaCaducidad) : null }
          : {}),
        ...(datos.stockActual !== undefined ? { stockActual: datos.stockActual } : {}),
        ...(datos.stockMinimo !== undefined ? { stockMinimo: datos.stockMinimo } : {}),
      },
    });

    return NextResponse.json({ producto });
  } catch (error) {
    return respuestaError(error);
  }
}
