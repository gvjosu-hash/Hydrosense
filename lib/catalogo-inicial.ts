import { TipoVenta, Unidad } from "@prisma/client";

export interface ProductoInicial {
  nombre: string;
  tipoVenta: TipoVenta;
  unidad: Unidad;
}

function pieza(nombre: string): ProductoInicial {
  return { nombre, tipoVenta: "PIEZA", unidad: "PIEZA" };
}

function granel(nombre: string, unidad: Extract<Unidad, "KG" | "G" | "L" | "ML">): ProductoInicial {
  return { nombre, tipoVenta: "GRANEL", unidad };
}

// Catálogo típico de una tienda de abarrotes/miscelánea en México. Se inserta
// automáticamente al crear una tienda nueva (ver app/api/auth/registro), con
// precio y stock en 0 — la tienda ajusta precios y existencias reales desde
// /productos. El orden importa: se guarda como Producto.orden para que la
// lista muestre primero lo más común en una tiendita real, en vez de un
// orden alfabético que se siente arbitrario.
export const catalogoInicial: ProductoInicial[] = [
  // Los más vendidos en una tiendita típica
  pieza("Coca-Cola 600 ml"),
  pieza("Agua Ciel 600 ml"),
  pieza("Sabritas Originales 45 g"),
  pieza("Pan Bimbo blanco grande"),
  pieza("Huevo (docena)"),
  pieza("Leche Lala 1 L"),
  pieza("Cerveza Corona 355 ml"),
  pieza("Cerveza Modelo 355 ml"),
  pieza("Cigarros (cajetilla)"),
  pieza("Tortillas de harina (paquete)"),
  pieza("Sopa instantánea Maruchan"),
  pieza("Doritos 62 g"),
  pieza("Galletas Marías Gamesa"),
  pieza("Gansito Marinela"),
  pieza("Chicles Trident"),
  pieza("Jabón de pasta Zote"),
  pieza("Papel higiénico (paquete 4 rollos)"),
  pieza("Detergente Ariel (bolsa)"),
  pieza("Café soluble Nescafé (frasco)"),
  pieza("Coca-Cola 2 L"),
  granel("Arroz a granel", "KG"),
  granel("Frijol a granel", "KG"),
  granel("Azúcar a granel", "KG"),
  pieza("Aceite Nutrioli 1 L"),
  pieza("Pulparindo"),

  // Más bebidas
  pieza("Coca-Cola 1 L"),
  pieza("Pepsi 600 ml"),
  pieza("Sprite 600 ml"),
  pieza("Fanta Naranja 600 ml"),
  pieza("Manzanita Sol 600 ml"),
  pieza("Agua Ciel 1.5 L"),
  pieza("Agua garrafón 20 L"),
  pieza("Jugo del Valle 1 L"),
  pieza("Boing 500 ml"),
  pieza("Gatorade 600 ml"),
  pieza("Red Bull 250 ml"),
  pieza("Leche Alpura 1 L"),
  pieza("Yogurt bebible Yoplait"),
  pieza("Cerveza Tecate 355 ml"),
  pieza("Cerveza Victoria 355 ml"),
  pieza("Caguama Corona 940 ml"),

  // Más botanas y dulces
  pieza("Cheetos 60 g"),
  pieza("Ruffles 48 g"),
  pieza("Cheetos Flamin Hot"),
  pieza("Cacahuates japoneses"),
  pieza("Barritas Marinela"),
  pieza("Pingüinos Marinela"),
  pieza("Chocolate Carlos V"),
  pieza("Chocolate Kinder Bueno"),
  pieza("Paleta Payaso"),
  pieza("Paleta Miguelito"),
  pieza("Bubulubu"),
  pieza("Mazapán De la Rosa"),
  pieza("Skwinkles"),

  // Más galletas y pan
  pieza("Galletas Emperador"),
  pieza("Galletas Chokis"),
  pieza("Galletas Príncipe"),
  pieza("Pan Bimbo chico"),
  pieza("Panqué Bimbo"),
  pieza("Concha"),
  pieza("Dona"),

  // Más abarrotes empaquetados
  pieza("Frijol 1 kg (bolsa)"),
  pieza("Azúcar 1 kg (bolsa)"),
  pieza("Sal 1 kg (bolsa)"),
  pieza("Arroz 1 kg (bolsa)"),
  pieza("Aceite 1-2-3 1 L"),
  pieza("Harina Maseca 1 kg"),
  pieza("Harina de trigo 1 kg"),
  pieza("Consomé de pollo Knorr"),
  pieza("Sopa La Moderna (pasta)"),
  pieza("Atún Dolores (lata)"),
  pieza("Sardina en lata"),
  pieza("Chiles en lata La Costeña"),
  pieza("Frijoles enteros de lata"),
  pieza("Leche Nido (lata)"),
  pieza("Leche evaporada Clemente Jacques"),
  pieza("Leche condensada La Lechera"),
  pieza("Mayonesa McCormick"),
  pieza("Catsup Del Monte"),
  pieza("Mostaza McCormick"),
  pieza("Vinagre embotellado"),
  pieza("Chile piquín (frasco)"),
  pieza("Café soluble (sobre)"),
  pieza("Té Lipton (caja)"),
  pieza("Gelatina D'gari"),
  pieza("Puré de tomate"),

  // Huevo y lácteos
  pieza("Queso panela"),
  pieza("Crema Lala"),
  pieza("Mantequilla"),

  // Limpieza y cuidado personal
  pieza("Suavizante Downy"),
  pieza("Cloro Cloralex"),
  pieza("Fabuloso"),
  pieza("Papel higiénico individual"),
  pieza("Servilletas"),
  pieza("Jabón de tocador"),
  pieza("Shampoo Sedal"),
  pieza("Pasta dental Colgate"),
  pieza("Cepillo de dientes"),
  pieza("Rastrillo Bic"),
  pieza("Toallas femeninas"),
  pieza("Pañales (paquete)"),
  pieza("Papel de cocina (rollo)"),
  pieza("Focos"),
  pieza("Pilas AA (paquete)"),
  pieza("Cerillos"),

  // Más a granel
  granel("Sal a granel", "KG"),
  granel("Harina a granel", "KG"),
  granel("Lentejas a granel", "KG"),
  granel("Avena a granel", "KG"),
  granel("Café molido a granel", "KG"),
  granel("Miel de abeja a granel", "KG"),
  granel("Chile piquín a granel", "G"),
  granel("Chile seco a granel", "G"),
  granel("Aceite comestible a granel", "L"),
  granel("Vinagre a granel", "L"),
  granel("Cloro a granel", "L"),
  granel("Jabón líquido a granel", "L"),
  granel("Esencia de vainilla a granel", "ML"),
  granel("Alcohol a granel", "ML"),
];
