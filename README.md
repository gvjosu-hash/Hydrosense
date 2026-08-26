# Xolo — punto de venta para tiendas de abarrotes

Next.js (App Router) + TypeScript, Prisma sobre PostgreSQL, autenticación
propia con JWT en cookie httpOnly, y Tailwind v4 para la interfaz.

## Estado actual

Implementadas las secciones 1–6 del alcance del MVP:

1. Cuentas y acceso multi-tenant (registro, login, sesión persistente).
2. Catálogo de productos (alta, edición, baja, búsqueda).
3. Punto de venta y flujo de cobro (carrito, efectivo, cambio, ticket en PDF).
4. Inventario con alerta de stock bajo.
5. Corte de caja (esperado por el sistema vs. contado, historial).
6. Catálogo precargado (~119 productos típicos de abarrotes en México).

**Pendiente (sección 7 en adelante):** integración con Mercado Pago
(suscripciones, cobro recurrente, webhooks), cuenta demo con datos de
sandbox, y sincronización offline. Ver la sección "Qué falta" abajo.

## Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (recomendado: [Supabase](https://supabase.com))

## Configuración local

```bash
npm install
cp .env.example .env
# Edita .env: DATABASE_URL (tu Postgres) y JWT_SECRET (genera uno con:
# openssl rand -base64 48)
npx prisma migrate deploy   # aplica las migraciones existentes
npm run dev
```

### Usando Supabase como base de datos

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → Database → Connection string**, copia la cadena
   en modo **Transaction** (puerto 6543, para entornos serverless) o
   **Session** (puerto 5432, para un servidor Node tradicional de larga
   duración) según cómo vayas a hospedar la app.
3. Pega esa cadena en `DATABASE_URL` en tu `.env`.
4. Corre `npx prisma migrate deploy` para crear las tablas.

## Estructura del proyecto

```
app/
  (auth)/login, (auth)/registro        páginas públicas de acceso
  (dashboard)/pos|productos|inventario|corte-caja   pantallas protegidas
  api/auth, api/productos, api/ventas, api/cortes-caja   rutas de API
components/
  ui/          botones, campos, tarjetas, modal, toasts — sistema de diseño
  mascota/     silueta SVG de Xolo
  productos/   formulario de alta/edición de producto
  pos/         carrito, teclado numérico, modales de cobro
lib/
  db.ts        cliente Prisma
  auth.ts      JWT, cookies, hash de contraseñas
  tenant.ts    lectura de sesión — único punto para obtener el tiendaId
  cortes-caja.ts   cálculo del corte pendiente
  catalogo-inicial.ts   catálogo de ~119 productos para tiendas nuevas
  validaciones/    esquemas zod compartidos entre rutas de API
prisma/schema.prisma   modelo de datos
```

### Aislamiento multi-tenant

Toda tabla operativa tiene `tiendaId`. La única forma soportada de leer la
sesión actual es `obtenerSesion()` / `requerirSesion()` en `lib/tenant.ts`
(lee la cookie httpOnly, nunca un valor enviado por el cliente); toda
ruta de API debe filtrar sus queries por el `tiendaId` que de ahí resulte.

## Qué falta (y qué necesito de ti para continuar)

Antes de construir la sección 7 (Mercado Pago) necesito que generes y me
compartas (como variables de entorno, no como texto en el chat si es
posible):

- `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY` de una aplicación de Mercado Pago
  (credenciales de **prueba/sandbox** para desarrollo; las de producción
  se agregan solo cuando decidas lanzar con cobro real).
- Confirmar el modo de suscripción: `preapproval_plan` estándar con
  `transaction_amount: 110`, `currency_id: MXN`, `frequency: 1 month`,
  `free_trial` de 14 días, sin `billing_day` fijo (cada tienda cobra en
  su propio aniversario).
- Una URL pública donde Mercado Pago pueda enviar el webhook de pagos
  (depende de dónde despliegues la app).
- Confirmar el proveedor de hosting (Vercel/Railway/Render/otro) para
  definir cómo se ejecuta el cron mensual de transferencia a CLABE.

Con eso, las siguientes secciones a construir son:

7. Suscripción y cobro con Mercado Pago (preapproval, webhook, estados).
8. Usuario de pruebas con datos de sandbox, separado de tiendas reales.
9. Sincronización offline (IndexedDB/Dexie + cola de sincronización) y
   respaldo automático.
