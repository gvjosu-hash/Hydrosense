import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  // `prisma generate` no necesita una conexión real (solo lee el schema), así
  // que usamos process.env directo en vez del helper `env()` de prisma/config:
  // ese helper valida la variable de inmediato al cargar este archivo y hace
  // fallar `npm install` en cualquier entorno de build donde DATABASE_URL aún
  // no esté configurada (p. ej. Netlify antes de agregar la variable).
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
