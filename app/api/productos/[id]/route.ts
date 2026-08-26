import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirSesion } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { esquemaProducto } from "@/lib/validaciones/producto";

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
    if (typeof cuerpo.activo !== "boolean") {
      return NextResponse.json({ error: "Falta el campo 'activo'" }, { status: 400 });
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: { activo: cuerpo.activo },
    });

    return NextResponse.json({ producto });
  } catch (error) {
    return respuestaError(error);
  }
}
