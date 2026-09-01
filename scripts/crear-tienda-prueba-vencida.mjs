// Crea (si no existen) tiendas de prueba con la suscripción ya vencida
// (como si sus 15 días de prueba ya hubieran pasado), para poder probar el
// flujo real de pago desde cuentas reales de Mercado Pago (correo real,
// no la cuenta vitalicia exenta) — incluyendo cuentas de terceros, para
// descartar que el problema sea "pagarse a uno mismo" con la misma cuenta
// de Mercado Pago del vendedor. Se corre en cada build (ver "build" en
// package.json); si una cuenta ya existe no se toca, para no pisar el
// avance de las pruebas que se hagan con ella.
import "dotenv/config";
import { randomUUID } from "crypto";
import pg from "pg";

// Hash de bcrypt (12 rounds) de la contraseña que pidió el usuario (misma
// para todas estas cuentas de prueba). Nunca se guarda en texto plano.
const PASSWORD_HASH = "$2b$12$m47eXQW87M3KpidsD.xZFu6lSEuuLKLB3jBzufJZY9YKWY9WEPCnu";

const CUENTAS = [
  { correo: "gvjosu@gmail.com", nombreTienda: "Tienda Prueba Vencida", nombreUsuario: "Prueba Vencida" },
  {
    correo: "cabello.michellevanessa.253@gmail.com",
    nombreTienda: "Tienda Prueba Vencida 2",
    nombreUsuario: "Prueba Vencida 2",
  },
];

async function crearCuenta(client, cuenta) {
  const { rows } = await client.query(`SELECT id FROM usuarios WHERE correo = $1`, [cuenta.correo]);
  if (rows.length > 0) {
    console.log(`crear-tienda-prueba-vencida: ${cuenta.correo} ya existía, sin cambios.`);
    return;
  }

  const tiendaId = randomUUID();
  const usuarioId = randomUUID();

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO tiendas (id, nombre, "esDemo", "exentaDePago", "createdAt")
       VALUES ($1, $2, false, false, now())`,
      [tiendaId, cuenta.nombreTienda]
    );
    await client.query(
      `INSERT INTO usuarios (id, "tiendaId", correo, whatsapp, "passwordHash", nombre, rol, "esAdminPlataforma", "createdAt")
       VALUES ($1, $2, $3, NULL, $4, $5, 'DUENO', false, now())`,
      [usuarioId, tiendaId, cuenta.correo, PASSWORD_HASH, cuenta.nombreUsuario]
    );
    await client.query(
      `INSERT INTO productos
         (id, "tiendaId", nombre, "tipoVenta", unidad, precio, "stockActual", "stockMinimo", activo, orden, "createdAt", "updatedAt")
       VALUES ($1, $2, 'Producto pruebas', 'PIEZA', 'PIEZA', 0, 0, 0, true, 1, now(), now())`,
      [randomUUID(), tiendaId]
    );
    // Prueba ya vencida: inicio hace 20 días, fin hace 5 (calcularAcceso la
    // ve como PRUEBA con fechaFinPrueba en el pasado -> bloqueada).
    await client.query(
      `INSERT INTO suscripciones (id, "tiendaId", estado, "fechaInicioPrueba", "fechaFinPrueba", "createdAt", "updatedAt")
       VALUES ($1, $2, 'PRUEBA', now() - interval '20 days', now() - interval '5 days', now(), now())`,
      [randomUUID(), tiendaId]
    );
    await client.query("COMMIT");
    console.log(`crear-tienda-prueba-vencida: ${cuenta.correo} creada correctamente.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("crear-tienda-prueba-vencida: falta DATABASE_URL, se omite.");
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    for (const cuenta of CUENTAS) {
      await crearCuenta(client, cuenta);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("crear-tienda-prueba-vencida: error:");
  console.error(error);
  process.exit(1);
});
