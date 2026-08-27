import { z } from "zod";

export const esquemaMerma = z.object({
  productoId: z.string().min(1, "Elige un producto"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  motivo: z.enum(["CADUCIDAD", "DANO", "ROBO", "OTRO"]),
  nota: z.string().trim().max(280).optional().or(z.literal("")),
});
