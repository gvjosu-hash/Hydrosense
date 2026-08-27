-- CreateEnum
CREATE TYPE "MotivoMerma" AS ENUM ('CADUCIDAD', 'DANO', 'ROBO', 'OTRO');

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "costo" DECIMAL(10,2),
ADD COLUMN     "fechaCaducidad" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "mermas" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "motivo" "MotivoMerma" NOT NULL,
    "nota" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mermas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mermas_tiendaId_fecha_idx" ON "mermas"("tiendaId", "fecha");

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "tiendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
