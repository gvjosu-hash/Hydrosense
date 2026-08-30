import { randomUUID } from "crypto";
import { catalogoInicial } from "../lib/catalogo-inicial";

// No hace falta que el id tenga el formato cuid de Prisma: es un texto
// libre como llave primaria, y esto se inserta con SQL directo, no con
// el cliente de Prisma.
function createId() {
  return randomUUID();
}

// Genera el SQL para crear, directo en Supabase, la cuenta con acceso
// permanente (exentaDePago) que pidió el usuario. No se ejecuta contra
// ninguna base de datos: solo imprime el SQL para pegarlo en el SQL
// Editor de Supabase. La contraseña ya viene hasheada con bcrypt (12
// rounds), igual que hace /api/auth/registro.
const PASSWORD_HASH = process.argv[2];
if (!PASSWORD_HASH) {
  console.error("Uso: tsx generar-sql-cuenta-permanente.ts <hash-bcrypt>");
  process.exit(1);
}

const tiendaId = createId();
const usuarioId = createId();

function escapar(texto: string) {
  return texto.replace(/'/g, "''");
}

const lineas: string[] = [];
lineas.push("BEGIN;");
lineas.push(
  `INSERT INTO tiendas (id, nombre, "esDemo", "exentaDePago", "createdAt") VALUES ('${tiendaId}', 'Cuenta de Pruebas Xolo', false, true, now());`
);
lineas.push(
  `INSERT INTO usuarios (id, "tiendaId", correo, whatsapp, "passwordHash", nombre, rol, "createdAt") VALUES ('${usuarioId}', '${tiendaId}', NULL, '5625129443', '${escapar(
    PASSWORD_HASH
  )}', 'Equipo Xolo', 'DUENO', now());`
);

catalogoInicial.forEach((producto, indice) => {
  const id = createId();
  lineas.push(
    `INSERT INTO productos (id, "tiendaId", nombre, "tipoVenta", unidad, precio, "stockActual", "stockMinimo", activo, orden, "createdAt", "updatedAt") VALUES ('${id}', '${tiendaId}', '${escapar(
      producto.nombre
    )}', '${producto.tipoVenta}', '${producto.unidad}', 0, 0, 0, true, ${indice + 1}, now(), now());`
  );
});

lineas.push("COMMIT;");

console.log(lineas.join("\n"));
console.error(`\n-- tiendaId: ${tiendaId}`);
console.error(`-- usuarioId: ${usuarioId}`);
