import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION } from "@/lib/auth";

export async function POST() {
  const almacenCookies = await cookies();
  almacenCookies.delete(COOKIE_SESION);
  return NextResponse.json({ ok: true });
}
