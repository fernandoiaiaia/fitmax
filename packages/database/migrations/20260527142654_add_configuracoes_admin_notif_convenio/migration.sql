-- CreateEnum
CREATE TYPE "ConsultaStatus" AS ENUM ('PENDENTE', 'PAGO', 'ESTORNO');

-- CreateEnum
CREATE TYPE "ConsultaTipo" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "PublicacaoStatus" AS ENUM ('ATIVA', 'DENUNCIADA', 'BANIDA');

-- CreateEnum
CREATE TYPE "PlanoPeriodo" AS ENUM ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ATIVO', 'INATIVO', 'BANIDO');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "username" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "especialidade" TEXT,
    "registroProfissional" TEXT,
    "cpf" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ATIVO',
    "plano" TEXT,
    "banidoPorId" TEXT,
    "banidoEm" TIMESTAMP(3),
    "motivoBan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "cpf" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ATIVO',
    "plano" TEXT,
    "banidoPorId" TEXT,
    "banidoEm" TIMESTAMP(3),
    "motivoBan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "tipo" "ConsultaTipo" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "taxaPlataforma" INTEGER NOT NULL DEFAULT 10,
    "status" "ConsultaStatus" NOT NULL DEFAULT 'PENDENTE',
    "repasseEm" TIMESTAMP(3),
    "estornoMotivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repasse" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "processadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publicacao" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "topico" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "imagemUrl" TEXT NOT NULL,
    "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comentarios" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicacaoStatus" NOT NULL DEFAULT 'ATIVA',
    "motivoBan" TEXT,
    "moderadoPorId" TEXT,
    "moderadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Denuncia" (
    "id" TEXT NOT NULL,
    "publicacaoId" TEXT NOT NULL,
    "clienteId" TEXT,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "PlanoPeriodo" NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "consultas" INTEGER NOT NULL,
    "taxa" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotifPrefs" (
    "adminId" TEXT NOT NULL,
    "novaConsulta" BOOLEAN NOT NULL DEFAULT true,
    "cancelamento" BOOLEAN NOT NULL DEFAULT true,
    "novoUsuario" BOOLEAN NOT NULL DEFAULT true,
    "assinaturaVencendo" BOOLEAN NOT NULL DEFAULT true,
    "relatorioSemanal" BOOLEAN NOT NULL DEFAULT false,
    "canalEmail" BOOLEAN NOT NULL DEFAULT true,
    "canalWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "canalPush" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotifPrefs_pkey" PRIMARY KEY ("adminId")
);

-- CreateTable
CREATE TABLE "Convenio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convenio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_cpf_key" ON "Professional"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_cpf_key" ON "Client"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Convenio_nome_key" ON "Convenio"("nome");

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_banidoPorId_fkey" FOREIGN KEY ("banidoPorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_banidoPorId_fkey" FOREIGN KEY ("banidoPorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repasse" ADD CONSTRAINT "Repasse_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repasse" ADD CONSTRAINT "Repasse_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacao" ADD CONSTRAINT "Publicacao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacao" ADD CONSTRAINT "Publicacao_moderadoPorId_fkey" FOREIGN KEY ("moderadoPorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_publicacaoId_fkey" FOREIGN KEY ("publicacaoId") REFERENCES "Publicacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotifPrefs" ADD CONSTRAINT "AdminNotifPrefs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
