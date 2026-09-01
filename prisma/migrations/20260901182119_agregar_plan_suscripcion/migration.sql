-- CreateEnum
CREATE TYPE "PlanSuscripcion" AS ENUM ('BASICO', 'MEDIANO', 'COMPLETO');

-- AlterTable
ALTER TABLE "suscripciones" ADD COLUMN     "plan" "PlanSuscripcion";
