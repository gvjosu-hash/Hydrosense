import { cookies } from "next/headers";
import { COOKIE_SESION, verificarSesion, SesionPayload } from "@/lib/auth";

/**
 * Lee y valida la sesión actual desde la cookie httpOnly. Toda ruta de API
 * o página que toque datos de una tienda debe pasar por aquí y usar el
 * tiendaId devuelto para filtrar — nunca confiar en un tiendaId enviado
 * por el cliente.
 */
export async function obtenerSesion(): Promise<SesionPayload | null> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (!token) return null;
  return verificarSesion(token);
}

export class ErrorNoAutenticado extends Error {
  constructor() {
    super("No autenticado");
  }
}

export async function requerirSesion(): Promise<SesionPayload> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorNoAutenticado();
  return sesion;
}
