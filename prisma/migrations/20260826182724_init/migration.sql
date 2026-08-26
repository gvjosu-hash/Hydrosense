-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('PIEZA', 'GRANEL');

-- CreateEnum
CREATE TYPE "Unidad" AS ENUM ('PIEZA', 'KG', 'G', 'L', 'ML');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('DUENO', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('PRUEBA', 'ACTIVA', 'PAGO_FALLIDO', 'CANCELADA');

-- CreateTable
CREATE TABLE "tiendas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "esDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "correo" TEXT,
    "whatsapp" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'DUENO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoVenta" "TipoVenta" NOT NULL,
    "unidad" "Unidad" NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "stockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "codigoBarras" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(10,2) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "montoRecibido" DECIMAL(10,2),
    "cambio" DECIMAL(10,2),
    "localId" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_items" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "venta_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cortes_caja" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSistema" DECIMAL(10,2) NOT NULL,
    "totalCapturado" DECIMAL(10,2) NOT NULL,
    "diferencia" DECIMAL(10,2) NOT NULL,
    "desglosePorMetodo" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cortes_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "mpPreapprovalId" TEXT,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PRUEBA',
    "fechaInicioPrueba" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFinPrueba" TIMESTAMP(3),
    "fechaProximoCobro" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_whatsapp_key" ON "usuarios"("whatsapp");

-- CreateIndex
CREATE INDEX "productos_tiendaId_idx" ON "productos"("tiendaId");

-- CreateIndex
CREATE INDEX "productos_tiendaId_codigoBarras_idx" ON "productos"("tiendaId", "codigoBarras");

-- CreateIndex
CREATE INDEX "ventas_tiendaId_fecha_idx" ON "ventas"("tiendaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_tiendaId_localId_key" ON "ventas"("tiendaId", "localId");

-- CreateIndex
CREATE INDEX "cortes_caja_tiendaId_fecha_idx" ON "cortes_caja"("tiendaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_tiendaId_key" ON "suscripciones"("tiendaId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cortes_caja" ADD CONSTRAINT "cortes_caja_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
