-- CreateEnum
CREATE TYPE "TipoTarjeta" AS ENUM ('CREDITO', 'DEBITO');

-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'TARJETA';

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "numeroAutorizacion" TEXT,
ADD COLUMN     "tipoTarjeta" "TipoTarjeta";
