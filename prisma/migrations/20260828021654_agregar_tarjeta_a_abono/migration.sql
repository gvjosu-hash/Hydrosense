-- CreateEnum
CREATE TYPE "MetodoPagoAbono" AS ENUM ('EFECTIVO', 'TARJETA');

-- AlterTable
ALTER TABLE "abonos" ADD COLUMN     "metodoPago" "MetodoPagoAbono" NOT NULL DEFAULT 'EFECTIVO',
ADD COLUMN     "numeroAutorizacion" TEXT,
ADD COLUMN     "tipoTarjeta" "TipoTarjeta";
