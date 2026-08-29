import { createHmac, timingSafeEqual } from "crypto";

/**
 * Valida la firma que manda Mercado Pago en el header `x-signature` de cada
 * webhook, para asegurarnos de que la notificación de verdad viene de ellos
 * y no de alguien que adivinó la URL. Si no hay secreto configurado, no se
 * valida (solo para desarrollo/pruebas iniciales).
 *
 * https://www.mercadopago.com/developers — Configurar notificaciones webhook
 */
export function validarFirmaWebhook(
  encabezadoFirma: string | null,
  requestId: string | null,
  dataId: string
): boolean {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;
  if (!encabezadoFirma) return false;

  const partes = Object.fromEntries(
    encabezadoFirma.split(",").map((parte) => {
      const [clave, valor] = parte.split("=");
      return [clave?.trim(), valor?.trim()];
    })
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifiesto = `id:${dataId.toLowerCase()};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
  const firmaCalculada = createHmac("sha256", secreto).update(manifiesto).digest("hex");

  const bufferCalculada = Buffer.from(firmaCalculada, "hex");
  const bufferRecibida = Buffer.from(v1, "hex");
  if (bufferCalculada.length !== bufferRecibida.length) return false;
  return timingSafeEqual(bufferCalculada, bufferRecibida);
}
