import { EstadoSuscripcion } from "@prisma/client";

export interface DatosAcceso {
  bloqueado: boolean;
  // Solo tiene valor mientras está en período de prueba activo.
  diasRestantesPrueba: number | null;
}

/**
 * Decide si una tienda puede usar el sistema. Una tienda exenta (cuenta
 * propia para pruebas y cambios) nunca se bloquea, sin importar su
 * suscripción.
 */
export function calcularAcceso(
  tienda: { exentaDePago: boolean },
  suscripcion: { estado: EstadoSuscripcion; fechaFinPrueba: Date | null } | null
): DatosAcceso {
  if (tienda.exentaDePago) {
    return { bloqueado: false, diasRestantesPrueba: null };
  }

  if (!suscripcion) {
    return { bloqueado: true, diasRestantesPrueba: null };
  }

  if (suscripcion.estado === "ACTIVA") {
    return { bloqueado: false, diasRestantesPrueba: null };
  }

  if (suscripcion.estado === "PRUEBA") {
    if (suscripcion.fechaFinPrueba && suscripcion.fechaFinPrueba.getTime() > Date.now()) {
      const diasRestantes = Math.ceil(
        (suscripcion.fechaFinPrueba.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return { bloqueado: false, diasRestantesPrueba: diasRestantes };
    }
    return { bloqueado: true, diasRestantesPrueba: null };
  }

  // PAGO_FALLIDO o CANCELADA
  return { bloqueado: true, diasRestantesPrueba: null };
}

/** Traduce el status que devuelve Mercado Pago al estado interno de Xolo. */
export function estadoDesdeMercadoPago(statusMp: string | undefined): EstadoSuscripcion | null {
  switch (statusMp) {
    case "authorized":
      return "ACTIVA";
    case "paused":
      return "PAGO_FALLIDO";
    case "cancelled":
      return "CANCELADA";
    default:
      // "pending" u otro valor: el comprador todavía no termina de
      // autorizar, no hay nada que actualizar todavía.
      return null;
  }
}
