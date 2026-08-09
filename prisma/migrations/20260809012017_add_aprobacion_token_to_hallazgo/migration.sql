-- AlterTable
ALTER TABLE "app918"."Hallazgo" ADD COLUMN     "aprobacionTokenExpira" TIMESTAMP(3),
ADD COLUMN     "aprobacionTokenHash" TEXT,
ADD COLUMN     "aprobacionTokenUsadoEn" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Hallazgo_aprobacionTokenHash_key" ON "app918"."Hallazgo"("aprobacionTokenHash");
