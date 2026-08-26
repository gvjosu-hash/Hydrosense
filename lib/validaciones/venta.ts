import { z } from "zod";

export const esquemaVenta = z.object({
  items: z
    .array(
      z.object({
        productoId: z.string().min(1),
        cantidad: z.coerce.number().positive("La cantidad debe ser mayor a cero"),
      })
    )
    .min(1, "Agrega al menos un producto"),
  metodoPago: z.enum(["EFECTIVO"]).default("EFECTIVO"),
  montoRecibido: z.coerce.number().min(0).optional(),
  localId: z.string().optional(),
});

export type DatosVenta = z.infer<typeof esquemaVenta>;
