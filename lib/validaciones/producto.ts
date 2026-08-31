import { z } from "zod";

export const esquemaProducto = z
  .object({
    nombre: z.string().trim().min(1, "Escribe un nombre"),
    tipoVenta: z.enum(["PIEZA", "GRANEL"]),
    unidad: z.enum(["PIEZA", "KG", "G", "L", "ML"]),
    precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
    // "" (campo vacío) debe quedar como costo desconocido (undefined), no
    // coercionarse a 0: si no, un producto sin costo capturado se reporta
    // con 100% de utilidad en vez de "costo parcial".
    costo: z.preprocess(
      (valor) => (valor === "" ? undefined : valor),
      z.coerce.number().min(0, "El costo no puede ser negativo").optional()
    ),
    categoria: z.string().trim().min(1).optional().or(z.literal("")),
    fechaCaducidad: z.string().trim().min(1).optional().or(z.literal("")),
    stockActual: z.coerce.number().min(0, "El stock no puede ser negativo").default(0),
    stockMinimo: z.coerce.number().min(0, "El stock mínimo no puede ser negativo").default(0),
    codigoBarras: z.string().trim().min(1).optional().or(z.literal("")),
  })
  .refine(
    (datos) =>
      (datos.tipoVenta === "PIEZA" && datos.unidad === "PIEZA") ||
      (datos.tipoVenta === "GRANEL" && datos.unidad !== "PIEZA"),
    {
      message: "La unidad no corresponde al tipo de venta",
      path: ["unidad"],
    }
  );

export type DatosProducto = z.infer<typeof esquemaProducto>;
