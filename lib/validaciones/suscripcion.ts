import { z } from "zod";

export const esquemaCrearSuscripcion = z.object({
  correo: z.string().trim().email("Escribe un correo válido").optional(),
  // Token de tarjeta generado en el navegador por el Payment Brick de
  // Mercado Pago. Si viene, se autoriza la suscripción directo (sin mandar
  // al usuario al checkout de Mercado Pago); si no, se usa back_url.
  cardTokenId: z.string().trim().min(1).optional(),
});
