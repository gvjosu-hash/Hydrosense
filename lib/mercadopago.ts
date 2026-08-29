import { MercadoPagoConfig } from "mercadopago";

// Cobro mensual único: Xolo no tiene planes ni niveles, todas las tiendas
// pagan lo mismo.
export const PRECIO_SUSCRIPCION_MXN = 110;
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
