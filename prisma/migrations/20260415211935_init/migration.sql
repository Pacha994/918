-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app918";

-- CreateEnum
CREATE TYPE "app918"."EstadoBici" AS ENUM ('ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada');

-- CreateEnum
CREATE TYPE "app918"."EstadoHallazgo" AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- CreateTable
CREATE TABLE "app918"."Taller" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "servicios" JSONB NOT NULL DEFAULT '[]',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Taller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app918"."Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app918"."Bici" (
    "id" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "color" TEXT,
    "estado" "app918"."EstadoBici" NOT NULL DEFAULT 'ingresada',
    "tipoServicio" TEXT,
    "problemas" TEXT[],
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "tallerId" TEXT NOT NULL,

    CONSTRAINT "Bici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app918"."FotoRecepcion" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "angulo" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biciId" TEXT NOT NULL,

    CONSTRAINT "FotoRecepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app918"."Hallazgo" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "fotoUrl" TEXT,
    "estado" "app918"."EstadoHallazgo" NOT NULL DEFAULT 'pendiente',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoEn" TIMESTAMP(3),
    "biciId" TEXT NOT NULL,

    CONSTRAINT "Hallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app918"."EventoHistorial" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biciId" TEXT NOT NULL,

    CONSTRAINT "EventoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Taller_whatsapp_key" ON "app918"."Taller"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_whatsapp_tallerId_key" ON "app918"."Cliente"("whatsapp", "tallerId");

-- AddForeignKey
ALTER TABLE "app918"."Cliente" ADD CONSTRAINT "Cliente_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "app918"."Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app918"."Bici" ADD CONSTRAINT "Bici_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "app918"."Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app918"."Bici" ADD CONSTRAINT "Bici_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "app918"."Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app918"."FotoRecepcion" ADD CONSTRAINT "FotoRecepcion_biciId_fkey" FOREIGN KEY ("biciId") REFERENCES "app918"."Bici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app918"."Hallazgo" ADD CONSTRAINT "Hallazgo_biciId_fkey" FOREIGN KEY ("biciId") REFERENCES "app918"."Bici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app918"."EventoHistorial" ADD CONSTRAINT "EventoHistorial_biciId_fkey" FOREIGN KEY ("biciId") REFERENCES "app918"."Bici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
