import { PlanSuscripcion } from "@prisma/client";

export interface InfoPlan {
  id: PlanSuscripcion;
  nombre: string;
  precio: number;
  // null = sin límite de productos.
  limiteProductos: number | null;
  descripcion: string;
}

// Tres niveles por tamaño de negocio: todos con las mismas funciones, solo
// cambia cuántos productos distintos puede tener el catálogo. Así se puede
// atacar desde un negocio chico (ropa, cafetería) hasta una tienda de
// abarrotes con catálogo grande, sin cobrarle lo mismo a los dos.
export const PLANES: Record<PlanSuscripcion, InfoPlan> = {
  BASICO: {
    id: "BASICO",
    nombre: "Plan Básico",
    precio: 40,
    limiteProductos: 40,
    descripcion: "Hasta 40 productos · todas las funciones",
  },
  MEDIANO: {
    id: "MEDIANO",
    nombre: "Plan Mediano",
    precio: 80,
    limiteProductos: 80,
    descripcion: "Hasta 80 productos · todas las funciones",
  },
  COMPLETO: {
    id: "COMPLETO",
    nombre: "Plan Completo",
    precio: 110,
    limiteProductos: null,
    descripcion: "Productos ilimitados · todas las funciones",
  },
};

export const LISTA_PLANES: InfoPlan[] = [PLANES.BASICO, PLANES.MEDIANO, PLANES.COMPLETO];

export function esPlanValido(valor: string): valor is PlanSuscripcion {
  return valor in PLANES;
}
