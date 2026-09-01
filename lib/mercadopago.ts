import { MercadoPagoConfig } from "mercadopago";

// Precio y límite de productos de cada plan: ver lib/planes.ts.
export const DIAS_PRUEBA_GRATIS = 15;

export function obtenerClienteMercadoPago(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "Falta configurar MP_ACCESS_TOKEN (credencial de Mercado Pago) en las variables de entorno"
    );
  }
  return new MercadoPagoConfig({ accessToken });
}
