import { NextResponse } from "next/server";
import { requerirAcceso } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { calcularResumenPendiente } from "@/lib/cortes-caja";

export async function GET() {
  try {
    const sesion = await requerirAcceso();
    const resumen = await calcularResumenPendiente(sesion.tiendaId);
    return NextResponse.json(resumen);
  } catch (error) {
    return respuestaError(error);
  }
}
