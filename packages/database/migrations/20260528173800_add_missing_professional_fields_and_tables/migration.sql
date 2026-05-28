-- CreateEnum
CREATE TYPE "DisponibilidadeEstado" AS ENUM ('DISPONIVEL', 'BLOQUEADO');

-- AlterTable: add missing columns to Professional
ALTER TABLE "Professional" ADD COLUMN "cidade" TEXT;
ALTER TABLE "Professional" ADD COLUMN "convenios" TEXT[];
ALTER TABLE "Professional" ADD COLUMN "notificacoes" JSONB DEFAULT '{}';
ALTER TABLE "Professional" ADD COLUMN "telefone" TEXT;
ALTER TABLE "Professional" ADD COLUMN "uf" TEXT;
ALTER TABLE "Professional" ADD COLUMN "username" TEXT;

-- CreateTable: Disponibilidade
CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "estado" "DisponibilidadeEstado" NOT NULL DEFAULT 'DISPONIVEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CurtidaFeed
CREATE TABLE "CurtidaFeed" (
    "id" TEXT NOT NULL,
    "publicacaoId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "clienteId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurtidaFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ComentarioFeed
CREATE TABLE "ComentarioFeed" (
    "id" TEXT NOT NULL,
    "publicacaoId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "clienteId" TEXT,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioFeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Disponibilidade_profissionalId_dia_idx" ON "Disponibilidade"("profissionalId", "dia");

-- CreateIndex
CREATE UNIQUE INDEX "Disponibilidade_profissionalId_dia_hora_key" ON "Disponibilidade"("profissionalId", "dia", "hora");

-- CreateIndex
CREATE INDEX "CurtidaFeed_publicacaoId_idx" ON "CurtidaFeed"("publicacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CurtidaFeed_profissionalId_publicacaoId_key" ON "CurtidaFeed"("profissionalId", "publicacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CurtidaFeed_clienteId_publicacaoId_key" ON "CurtidaFeed"("clienteId", "publicacaoId");

-- CreateIndex
CREATE INDEX "ComentarioFeed_publicacaoId_idx" ON "ComentarioFeed"("publicacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_username_key" ON "Professional"("username");

-- AddForeignKey
ALTER TABLE "Disponibilidade" ADD CONSTRAINT "Disponibilidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtidaFeed" ADD CONSTRAINT "CurtidaFeed_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtidaFeed" ADD CONSTRAINT "CurtidaFeed_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurtidaFeed" ADD CONSTRAINT "CurtidaFeed_publicacaoId_fkey" FOREIGN KEY ("publicacaoId") REFERENCES "Publicacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioFeed" ADD CONSTRAINT "ComentarioFeed_publicacaoId_fkey" FOREIGN KEY ("publicacaoId") REFERENCES "Publicacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioFeed" ADD CONSTRAINT "ComentarioFeed_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioFeed" ADD CONSTRAINT "ComentarioFeed_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
