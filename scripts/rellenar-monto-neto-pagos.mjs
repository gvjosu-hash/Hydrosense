// Rellena montoNeto en pagos que ya se guardaron antes de que ese campo
// existiera (webhook recibido antes de este cambio). Se corre en cada
// build; solo toca filas con montoNeto NULL, así que no vuelve a golpear
// la API de Mercado Pago por pagos ya rellenados.
import "dotenv/config";
import pg from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!databaseUrl) {
    console.log("rellenar-monto-neto-pagos: falta DATABASE_URL, se omite.");
    return;
  }
  if (!accessToken) {
    console.log("rellenar-monto-neto-pagos: falta MP_ACCESS_TOKEN, se omite.");
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, "mpPaymentId" FROM pagos WHERE "montoNeto" IS NULL`
    );
    if (rows.length === 0) {
      console.log("rellenar-monto-neto-pagos: nada que rellenar.");
      return;
    }

    for (const fila of rows) {
      const respuesta = await fetch(`https://api.mercadopago.com/v1/payments/${fila.mpPaymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!respuesta.ok) {
        console.log(
          `rellenar-monto-neto-pagos: no se pudo consultar el pago ${fila.mpPaymentId} (${respuesta.status}), se omite.`
        );
        continue;
      }
      const datos = await respuesta.json();
      const montoNeto = datos?.transaction_details?.net_received_amount;
      if (montoNeto === undefined || montoNeto === null) {
        console.log(`rellenar-monto-neto-pagos: el pago ${fila.mpPaymentId} no trae montoNeto todavía.`);
        continue;
      }
      await client.query(`UPDATE pagos SET "montoNeto" = $1 WHERE id = $2`, [montoNeto, fila.id]);
      console.log(`rellenar-monto-neto-pagos: pago ${fila.mpPaymentId} actualizado (neto ${montoNeto}).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("rellenar-monto-neto-pagos: error:");
  console.error(error);
  // No se aborta el build por esto: es un relleno de datos, no algo crítico.
});
