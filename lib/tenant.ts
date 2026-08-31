import { cookies } from "next/headers";
import { COOKIE_SESION, verificarSesion, SesionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularAcceso } from "@/lib/suscripcion";

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

export class ErrorSuscripcionBloqueada extends Error {
  constructor() {
    super("Tu periodo de prueba terminó. Suscríbete para seguir usando Xolo.");
  }
}

/**
 * Igual que requerirSesion(), pero además exige que la tienda tenga acceso
 * vigente (prueba activa, suscripción pagada, o cuenta exenta). Las rutas
 * de API deben usar esta función, no requerirSesion(), para que el bloqueo
 * por suscripción no dependa solo de que el navegador cargue el layout del
 * dashboard — si no, alguien con la sesión ya abierta podría seguir usando
 * la API directamente después de que termine su prueba.
 */
export async function requerirAcceso(): Promise<SesionPayload> {
  const sesion = await requerirSesion();
  const tienda = await prisma.tienda.findUnique({
    where: { id: sesion.tiendaId },
    select: { exentaDePago: true, suscripcion: true },
  });
  if (!tienda) throw new ErrorNoAutenticado();
  const acceso = calcularAcceso(tienda, tienda.suscripcion);
  if (acceso.bloqueado) throw new ErrorSuscripcionBloqueada();
  return sesion;
}
