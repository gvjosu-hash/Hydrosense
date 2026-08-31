-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "esAdminPlataforma" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "mpPaymentId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagos_mpPaymentId_key" ON "pagos"("mpPaymentId");

-- CreateIndex
CREATE INDEX "pagos_tiendaId_idx" ON "pagos"("tiendaId");

-- CreateIndex
CREATE INDEX "pagos_fecha_idx" ON "pagos"("fecha");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
