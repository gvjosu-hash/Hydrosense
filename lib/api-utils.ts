import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ErrorNoAutenticado, ErrorNoAutorizado, ErrorSuscripcionBloqueada } from "@/lib/tenant";

export function respuestaError(error: unknown) {
  if (error instanceof ErrorNoAutenticado) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (error instanceof ErrorNoAutorizado) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ErrorSuscripcionBloqueada) {
    return NextResponse.json({ error: error.message }, { status: 402 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: error.flatten() },
      { status: 400 }
    );
  }
  // Errores de Prisma/infra: nunca mostrar el mensaje crudo (expone rutas de
  // archivo y detalles internos), a diferencia de los Error lanzados a mano
  // en el código de negocio, cuyo mensaje sí está pensado para el usuario.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar la información" }, { status: 400 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
}
