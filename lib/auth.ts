import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const COOKIE_SESION = "xolo_sesion";
const DURACION_SESION_SEGUNDOS = 60 * 60 * 24 * 30; // 30 días

function obtenerSecreto() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) throw new Error("Falta la variable de entorno JWT_SECRET");
  return new TextEncoder().encode(secreto);
}

export interface SesionPayload {
  usuarioId: string;
  tiendaId: string;
  rol: string;
  [key: string]: unknown;
}

export async function hashearPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verificarPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function firmarSesion(payload: SesionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEGUNDOS}s`)
    .sign(obtenerSecreto());
}

export async function verificarSesion(token: string): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    if (
      typeof payload.usuarioId === "string" &&
      typeof payload.tiendaId === "string" &&
      typeof payload.rol === "string"
    ) {
      return payload as SesionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export const opcionesCookieSesion = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURACION_SESION_SEGUNDOS,
};
