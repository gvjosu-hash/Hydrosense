// Aplica las migraciones de prisma/migrations directamente por SQL, sin
// pasar por el binario nativo "schema-engine" de Prisma. Se usa en el build
// de producción porque algunos entornos de CI (se observó en Vercel) bloquean
// el postinstall de @prisma/engines que descarga ese binario, y "prisma
// migrate deploy" se queda colgado intentando usarlo. Este script logra lo
// mismo (aplicar el SQL y registrarlo en _prisma_migrations, la misma tabla
// que usa Prisma) con solo el driver de Postgres en JS puro.
import "dotenv/config";
import { readFileSync, readdirSync } from "fs";
import { createHash, randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaMigraciones = path.join(__dirname, "..", "prisma", "migrations");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "aplicar-migraciones: falta la variable de entorno DATABASE_URL. " +
        "Configúrala en tu plataforma de hosting (o en .env para desarrollo local) antes de compilar."
    );
    process.exit(1);
  }

  const nombresMigraciones = readdirSync(carpetaMigraciones, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    for (const nombre of nombresMigraciones) {
      const rutaSql = path.join(carpetaMigraciones, nombre, "migration.sql");
      const sql = readFileSync(rutaSql, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");

      const { rows } = await client.query(
        `SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
        [nombre]
      );

      if (rows.length > 0) {
        console.log(`aplicar-migraciones: ${nombre} ya estaba aplicada, se omite.`);
        continue;
      }

      console.log(`aplicar-migraciones: aplicando ${nombre}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO "_prisma_migrations"
             (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
           VALUES ($1, $2, $3, now(), now(), 1)`,
          [randomUUID(), checksum, nombre]
        );
        await client.query("COMMIT");
        console.log(`aplicar-migraciones: ${nombre} aplicada correctamente.`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("aplicar-migraciones: error al aplicar migraciones:");
  console.error(error);
  process.exit(1);
});
