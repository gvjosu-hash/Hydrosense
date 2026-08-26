import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/auth";

const RUTAS_PUBLICAS = ["/", "/login", "/registro"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    RUTAS_PUBLICAS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESION)?.value;
  const sesion = token ? await verificarSesion(token) : null;

  if (!sesion) {
    const destino = pathname.startsWith("/api")
      ? null
      : new URL("/login", request.url);
    if (!destino) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
