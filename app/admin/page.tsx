import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/tenant";
import { obtenerResumenAdmin } from "@/lib/admin-suscripciones";
import { Xolo } from "@/components/mascota/xolo";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";

const ETIQUETA_ESTADO: Record<string, string> = {
  ACTIVA: "Activa (pagando)",
  PRUEBA: "En prueba gratis",
  PAGO_FALLIDO: "Pago fallido",
  CANCELADA: "Cancelada",
  SIN_SUSCRIPCION: "Sin suscripción",
};

const TONO_ESTADO: Record<string, "ok" | "neutral" | "alerta" | "peligro"> = {
  ACTIVA: "ok",
  PRUEBA: "neutral",
  PAGO_FALLIDO: "alerta",
  CANCELADA: "peligro",
  SIN_SUSCRIPCION: "neutral",
};

function formatoFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function formatoFechaHora(fecha: Date): string {
  return fecha.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default async function PaginaAdmin() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.usuarioId },
    select: { esAdminPlataforma: true },
  });
  if (!usuario?.esAdminPlataforma) {
    redirect("/pos");
  }

  const resumen = await obtenerResumenAdmin();

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Xolo className="w-10 h-auto" />
        <h1 className="text-2xl font-bold">Panel de administrador</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tarjeta className="p-4">
          <p className="text-texto-suave text-sm">Tiendas totales</p>
          <p className="text-3xl font-bold">{resumen.totalTiendas}</p>
        </Tarjeta>
        <Tarjeta className="p-4">
          <p className="text-texto-suave text-sm">Cuentas exentas</p>
          <p className="text-3xl font-bold">{resumen.tiendasExentas}</p>
        </Tarjeta>
      </div>

      <Tarjeta className="p-4 flex flex-col gap-2">
        <h2 className="font-bold text-lg">Suscripciones por estado</h2>
        {resumen.conteoPorEstado.length === 0 ? (
          <p className="text-texto-suave text-sm">Aún no hay tiendas suscritas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {resumen.conteoPorEstado.map((c) => (
              <div key={c.estado} className="flex items-center justify-between">
                <Insignia tono={TONO_ESTADO[c.estado] ?? "neutral"}>
                  {ETIQUETA_ESTADO[c.estado] ?? c.estado}
                </Insignia>
                <span className="font-bold">{c.tiendas}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-texto-suave text-sm pt-2 border-t border-borde mt-1">
          Ingreso mensual recurrente estimado (tiendas activas × $110):{" "}
          <span className="font-bold text-texto">${resumen.ingresoMensualEstimado.toFixed(2)}</span>
        </p>
      </Tarjeta>

      <Tarjeta className="p-4 flex flex-col gap-2 border-2 border-acento">
        <h2 className="font-bold text-lg">Próximo depósito</h2>
        <p className="text-texto-suave text-sm">
          Mercado Pago deposita el día 6 de cada mes lo acumulado hasta el día 5. Este es el corte
          en curso:
        </p>
        <p className="text-sm">
          Periodo: {formatoFecha(resumen.periodo.desde)} – {formatoFecha(resumen.periodo.hasta)}
        </p>
        <p className="text-sm">
          Se deposita el: <span className="font-semibold">{formatoFecha(resumen.periodo.fechaDeposito)}</span>
        </p>
        <p className="text-3xl font-bold text-acento-fuerte mt-1">
          ${resumen.acumuladoPeriodo.toFixed(2)}
        </p>
        <p className="text-texto-suave text-sm">
          {resumen.numeroPagosPeriodo} pago{resumen.numeroPagosPeriodo === 1 ? "" : "s"} acreditado
          {resumen.numeroPagosPeriodo === 1 ? "" : "s"} en este corte
        </p>
      </Tarjeta>

      <Tarjeta className="p-4 flex flex-col gap-2">
        <h2 className="font-bold text-lg">Últimos pagos acreditados</h2>
        {resumen.ultimosPagos.length === 0 ? (
          <p className="text-texto-suave text-sm">
            Todavía no hay pagos reales registrados (esto se llena cuando Mercado Pago confirma un
            cobro por webhook).
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {resumen.ultimosPagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.tiendaNombre}</p>
                  <p className="text-texto-suave text-sm">{formatoFechaHora(p.fecha)}</p>
                </div>
                <p className="font-bold shrink-0">${p.monto.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>
    </main>
  );
}
