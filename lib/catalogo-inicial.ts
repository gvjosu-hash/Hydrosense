import { TipoVenta, Unidad } from "@prisma/client";

export interface ProductoInicial {
  nombre: string;
  tipoVenta: TipoVenta;
  unidad: Unidad;
}

// Se inserta automáticamente al crear una tienda nueva (ver
// app/api/auth/registro), con precio y stock en 0, para que la tienda
// tenga algo con qué probar el POS antes de capturar su propio catálogo.
export const catalogoInicial: ProductoInicial[] = [
  { nombre: "Producto pruebas", tipoVenta: "PIEZA", unidad: "PIEZA" },
];
