import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { COOKIE_SESION, firmarSesion, hashearPassword, opcionesCookieSesion } from "@/lib/auth";
import { respuestaError } from "@/lib/api-utils";
import { catalogoInicial } from "@/lib/catalogo-inicial";
import { DIAS_PRUEBA_GRATIS } from "@/lib/mercadopago";

const esquemaRegistro = z.object({
  nombreTienda: z.string().trim().min(2, "El nombre de la tienda es muy corto"),
  nombreUsuario: z.string().trim().min(2, "Escribe tu nombre"),
  contacto: z.string().trim().min(3, "Captura tu correo o WhatsApp"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

function separarContacto(contacto: string): { correo: string | null; whatsapp: string | null } {
  if (contacto.includes("@")) {
    return { correo: contacto.toLowerCase(), whatsapp: null };
  }
  const soloDigitos = contacto.replace(/[^0-9]/g, "");
  return { correo: null, whatsapp: soloDigitos };
}

export async function POST(request: Request) {
  try {
    const cuerpo = await request.json();
    const datos = esquemaRegistro.parse(cuerpo);
    const { correo, whatsapp } = separarContacto(datos.contacto);

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) {
      return NextResponse.json(
        { error: "El WhatsApp debe tener entre 10 y 15 dígitos" },
        { status: 400 }
      );
    }

    if (correo) {
      const existente = await prisma.usuario.findUnique({ where: { correo } });
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese correo" },
          { status: 409 }
        );
      }
    }
    if (whatsapp) {
      const existente = await prisma.usuario.findUnique({ where: { whatsapp } });
      if (existente) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con ese WhatsApp" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashearPassword(datos.password);

    const { tienda, usuario } = await prisma.$transaction(async (tx) => {
      const tienda = await tx.tienda.create({
        data: { nombre: datos.nombreTienda },
      });
      const usuario = await tx.usuario.create({
        data: {
          tiendaId: tienda.id,
          nombre: datos.nombreUsuario,
          correo,
          whatsapp,
          passwordHash,
          rol: "DUENO",
        },
      });
      if (catalogoInicial.length > 0) {
        await tx.producto.createMany({
          data: catalogoInicial.map((p, indice) => ({
            tiendaId: tienda.id,
            nombre: p.nombre,
            tipoVenta: p.tipoVenta,
            unidad: p.unidad,
            precio: 0,
            stockActual: 0,
            stockMinimo: 0,
            orden: indice + 1,
          })),
        });
      }
      const ahora = new Date();
      const fechaFinPrueba = new Date(ahora.getTime() + DIAS_PRUEBA_GRATIS * 24 * 60 * 60 * 1000);
      await tx.suscripcion.create({
        data: {
          tiendaId: tienda.id,
          estado: "PRUEBA",
          fechaInicioPrueba: ahora,
          fechaFinPrueba,
        },
      });
      return { tienda, usuario };
    });

    const token = await firmarSesion({
      usuarioId: usuario.id,
      tiendaId: tienda.id,
      rol: usuario.rol,
    });

    const almacenCookies = await cookies();
    almacenCookies.set(COOKIE_SESION, token, opcionesCookieSesion);

    return NextResponse.json({
      tienda: { id: tienda.id, nombre: tienda.nombre },
      usuario: { id: usuario.id, nombre: usuario.nombre },
    });
  } catch (error) {
    return respuestaError(error);
  }
}
