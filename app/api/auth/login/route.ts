import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { COOKIE_SESION, firmarSesion, verificarPassword, opcionesCookieSesion } from "@/lib/auth";
import { respuestaError } from "@/lib/api-utils";

const esquemaLogin = z.object({
  identificador: z.string().trim().min(3, "Escribe tu correo o WhatsApp"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function POST(request: Request) {
  try {
    const cuerpo = await request.json();
    const datos = esquemaLogin.parse(cuerpo);
    const identificador = datos.identificador.toLowerCase();

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [{ correo: identificador }, { whatsapp: datos.identificador.trim() }],
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Correo/WhatsApp o contraseña incorrectos" }, { status: 401 });
    }

    const passwordValida = await verificarPassword(datos.password, usuario.passwordHash);
    if (!passwordValida) {
      return NextResponse.json({ error: "Correo/WhatsApp o contraseña incorrectos" }, { status: 401 });
    }

    const token = await firmarSesion({
      usuarioId: usuario.id,
      tiendaId: usuario.tiendaId,
      rol: usuario.rol,
    });

    const almacenCookies = await cookies();
    almacenCookies.set(COOKIE_SESION, token, opcionesCookieSesion);

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        esAdminPlataforma: usuario.esAdminPlataforma,
      },
    });
  } catch (error) {
    return respuestaError(error);
  }
}
