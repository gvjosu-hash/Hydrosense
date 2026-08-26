import { TipoVenta, Unidad } from "@prisma/client";

export interface ProductoInicial {
  nombre: string;
  tipoVenta: TipoVenta;
  unidad: Unidad;
}

// TODO(sección 6): reemplazar por el catálogo completo de ~100 artículos
// típicos de una tienda de abarrotes en México.
export const catalogoInicial: ProductoInicial[] = [];
