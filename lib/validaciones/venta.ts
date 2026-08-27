import { z } from "zod";

export const esquemaVenta = z
  .object({
    items: z
      .array(
        z.object({
          productoId: z.string().min(1),
          cantidad: z.coerce.number().positive("La cantidad debe ser mayor a cero"),
        })
      )
      .min(1, "Agrega al menos un producto"),
    metodoPago: z.enum(["EFECTIVO", "FIADO"]).default("EFECTIVO"),
    montoRecibido: z.coerce.number().min(0).optional(),
    clienteId: z.string().optional(),
    localId: z.string().optional(),
  })
  .refine((datos) => datos.metodoPago !== "FIADO" || !!datos.clienteId, {
    message: "Elige a qué cliente se le fía la venta",
    path: ["clienteId"],
  });

export type DatosVenta = z.infer<typeof esquemaVenta>;
