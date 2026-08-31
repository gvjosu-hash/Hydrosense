import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/tenant";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ usuario: null }, { status: 200 });
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: sesion.usuarioId, tiendaId: sesion.tiendaId },
    select: {
      id: true,
      nombre: true,
      rol: true,
      esAdminPlataforma: true,
      tienda: { select: { id: true, nombre: true, esDemo: true } },
    },
  });

  return NextResponse.json({ usuario });
}
