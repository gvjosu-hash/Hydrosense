import { z } from "zod";

export const esquemaCliente = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del cliente"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "El WhatsApp debe tener solo números (10 a 15 dígitos)")
    .optional()
    .or(z.literal("")),
});

export const esquemaAbono = z.object({
  monto: z.coerce.number().positive("El abono debe ser mayor a cero"),
});
