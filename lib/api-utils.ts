import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ErrorNoAutenticado } from "@/lib/tenant";

export function respuestaError(error: unknown) {
  if (error instanceof ErrorNoAutenticado) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: error.flatten() },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
}
