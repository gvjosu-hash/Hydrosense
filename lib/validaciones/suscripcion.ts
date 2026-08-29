import { z } from "zod";

export const esquemaCrearSuscripcion = z.object({
  correo: z.string().trim().email("Escribe un correo válido").optional(),
});
