// Crea (si no existe) la cuenta con acceso permanente (exentaDePago) que
// pidió el dueño del proyecto, para poder entrar a probar y hacer cambios
// sin depender del estado de ninguna suscripción. Se corre en cada build
// (ver "build" en package.json), así que es seguro que se ejecute muchas
// veces: si la cuenta ya existe, no hace nada más que confirmar que siga
// exenta.
//
// El catálogo de abajo es una copia fija de lib/catalogo-inicial.ts al
// momento de escribir este script (no se importa directo porque este
// archivo corre como Node plano, antes de que Next.js compile el TS).
import "dotenv/config";
import { randomUUID } from "crypto";
import pg from "pg";

const WHATSAPP = "5625129443";
const NOMBRE_TIENDA = "Cuenta de Pruebas Xolo";
const NOMBRE_USUARIO = "Equipo Xolo";
// Hash de bcrypt (12 rounds) de la contraseña que pidió el usuario. Nunca
// se guarda la contraseña en texto plano.
const PASSWORD_HASH = "$2b$12$TcAbuRMgBM8wM.ZqU1KsjOWL7zY3o8Mb0jbc4NHNQtA68sqfL/Fxu";

const CATALOGO_INICIAL = [
  { nombre: "Coca-Cola 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Agua Ciel 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sabritas Originales 45 g", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pan Bimbo blanco grande", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Huevo (docena)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Leche Lala 1 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cerveza Corona 355 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cerveza Modelo 355 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cigarros (cajetilla)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Tortillas de harina (paquete)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sopa instantánea Maruchan", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Doritos 62 g", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Galletas Marías Gamesa", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Gansito Marinela", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Chicles Trident", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Jabón de pasta Zote", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Papel higiénico (paquete 4 rollos)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Detergente Ariel (bolsa)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Café soluble Nescafé (frasco)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Coca-Cola 2 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Arroz a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Frijol a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Azúcar a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Aceite Nutrioli 1 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pulparindo", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Coca-Cola 1 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pepsi 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sprite 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Fanta Naranja 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Manzanita Sol 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Agua Ciel 1.5 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Agua garrafón 20 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Jugo del Valle 1 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Boing 500 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Gatorade 600 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Red Bull 250 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Leche Alpura 1 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Yogurt bebible Yoplait", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cerveza Tecate 355 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cerveza Victoria 355 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Caguama Corona 940 ml", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cheetos 60 g", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Ruffles 48 g", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cheetos Flamin Hot", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cacahuates japoneses", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Barritas Marinela", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pingüinos Marinela", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Chocolate Carlos V", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Chocolate Kinder Bueno", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Paleta Payaso", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Paleta Miguelito", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Bubulubu", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Mazapán De la Rosa", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Skwinkles", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Galletas Emperador", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Galletas Chokis", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Galletas Príncipe", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pan Bimbo chico", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Panqué Bimbo", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Concha", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Dona", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Frijol 1 kg (bolsa)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Azúcar 1 kg (bolsa)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sal 1 kg (bolsa)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Arroz 1 kg (bolsa)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Aceite 1-2-3 1 L", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Harina Maseca 1 kg", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Harina de trigo 1 kg", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Consomé de pollo Knorr", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sopa La Moderna (pasta)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Atún Dolores (lata)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sardina en lata", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Chiles en lata La Costeña", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Frijoles enteros de lata", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Leche Nido (lata)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Leche evaporada Clemente Jacques", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Leche condensada La Lechera", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Mayonesa McCormick", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Catsup Del Monte", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Mostaza McCormick", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Vinagre embotellado", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Chile piquín (frasco)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Café soluble (sobre)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Té Lipton (caja)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Gelatina D'gari", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Puré de tomate", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Queso panela", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Crema Lala", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Mantequilla", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Suavizante Downy", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cloro Cloralex", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Fabuloso", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Papel higiénico individual", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Servilletas", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Jabón de tocador", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Shampoo Sedal", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pasta dental Colgate", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cepillo de dientes", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Rastrillo Bic", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Toallas femeninas", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pañales (paquete)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Papel de cocina (rollo)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Focos", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Pilas AA (paquete)", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Cerillos", tipoVenta: "PIEZA", unidad: "PIEZA" },
  { nombre: "Sal a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Harina a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Lentejas a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Avena a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Café molido a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Miel de abeja a granel", tipoVenta: "GRANEL", unidad: "KG" },
  { nombre: "Chile piquín a granel", tipoVenta: "GRANEL", unidad: "G" },
  { nombre: "Chile seco a granel", tipoVenta: "GRANEL", unidad: "G" },
  { nombre: "Aceite comestible a granel", tipoVenta: "GRANEL", unidad: "L" },
  { nombre: "Vinagre a granel", tipoVenta: "GRANEL", unidad: "L" },
  { nombre: "Cloro a granel", tipoVenta: "GRANEL", unidad: "L" },
  { nombre: "Jabón líquido a granel", tipoVenta: "GRANEL", unidad: "L" },
  { nombre: "Esencia de vainilla a granel", tipoVenta: "GRANEL", unidad: "ML" },
  { nombre: "Alcohol a granel", tipoVenta: "GRANEL", unidad: "ML" },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("asegurar-cuenta-permanente: falta DATABASE_URL, se omite.");
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query(
      `SELECT u.id AS "usuarioId", u."tiendaId" FROM usuarios u WHERE u.whatsapp = $1`,
      [WHATSAPP]
    );

    if (rows.length > 0) {
      await client.query(`UPDATE tiendas SET "exentaDePago" = true WHERE id = $1`, [
        rows[0].tiendaId,
      ]);
      console.log("asegurar-cuenta-permanente: la cuenta ya existía, se confirmó exentaDePago.");
      return;
    }

    const tiendaId = randomUUID();
    const usuarioId = randomUUID();

    await client.query("BEGIN");
    try {
      await client.query(
        `INSERT INTO tiendas (id, nombre, "esDemo", "exentaDePago", "createdAt")
         VALUES ($1, $2, false, true, now())`,
        [tiendaId, NOMBRE_TIENDA]
      );
      await client.query(
        `INSERT INTO usuarios (id, "tiendaId", correo, whatsapp, "passwordHash", nombre, rol, "createdAt")
         VALUES ($1, $2, NULL, $3, $4, $5, 'DUENO', now())`,
        [usuarioId, tiendaId, WHATSAPP, PASSWORD_HASH, NOMBRE_USUARIO]
      );
      for (const [indice, producto] of CATALOGO_INICIAL.entries()) {
        await client.query(
          `INSERT INTO productos
             (id, "tiendaId", nombre, "tipoVenta", unidad, precio, "stockActual", "stockMinimo", activo, orden, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, 0, 0, 0, true, $6, now(), now())`,
          [randomUUID(), tiendaId, producto.nombre, producto.tipoVenta, producto.unidad, indice + 1]
        );
      }
      await client.query("COMMIT");
      console.log("asegurar-cuenta-permanente: cuenta creada correctamente.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("asegurar-cuenta-permanente: error:");
  console.error(error);
  process.exit(1);
});
