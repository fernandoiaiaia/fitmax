-- CreateEnum
CREATE TYPE "PlanoAudiencia" AS ENUM ('CLIENTE', 'PROFISSIONAL');

-- AlterTable: add audiencia column to Plano (default CLIENTE preserves existing records)
ALTER TABLE "Plano" ADD COLUMN "audiencia" "PlanoAudiencia" NOT NULL DEFAULT 'CLIENTE';
