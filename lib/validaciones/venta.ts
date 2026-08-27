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
    metodoPago: z.enum(["EFECTIVO", "TARJETA", "FIADO"]).default("EFECTIVO"),
    montoRecibido: z.coerce.number().min(0).optional(),
    tipoTarjeta: z.enum(["CREDITO", "DEBITO"]).optional(),
    numeroAutorizacion: z.string().trim().optional(),
    clienteId: z.string().optional(),
    localId: z.string().optional(),
  })
  .refine((datos) => datos.metodoPago !== "FIADO" || !!datos.clienteId, {
    message: "Elige a qué cliente se le fía la venta",
    path: ["clienteId"],
  })
  .refine(
    (datos) => datos.metodoPago !== "TARJETA" || (datos.montoRecibido ?? 0) > 0,
    { message: "Ingresa el monto cobrado en la terminal", path: ["montoRecibido"] }
  )
  .refine((datos) => datos.metodoPago !== "TARJETA" || !!datos.tipoTarjeta, {
    message: "Indica si fue crédito o débito",
    path: ["tipoTarjeta"],
  })
  .refine(
    (datos) => datos.metodoPago !== "TARJETA" || !!datos.numeroAutorizacion?.trim(),
    { message: "Anota el número de autorización del voucher", path: ["numeroAutorizacion"] }
  );

export type DatosVenta = z.infer<typeof esquemaVenta>;
