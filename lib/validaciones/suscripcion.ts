import { z } from "zod";

export const esquemaCrearSuscripcion = z.object({
  correo: z.string().trim().email("Escribe un correo válido").optional(),
  // Token de tarjeta ya generado en el navegador (mercadopago.js) cuando se
  // usa el formulario embebido en vez de la redirección al checkout de
  // Mercado Pago. Si no viene, se usa el flujo anterior (back_url).
  cardTokenId: z.string().trim().min(1).optional(),
});
