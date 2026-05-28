-- Migration: add_avaliacao_consulta
-- OWASP A08: @unique em consultaId garante que cada consulta só pode ter UMA avaliação (idempotência)
-- OWASP A01: clienteId rastreia quem avaliou (auditoria)

CREATE TABLE "AvaliacaoConsulta" (
    "id"           TEXT NOT NULL,
    "consultaId"   TEXT NOT NULL,
    "clienteId"    TEXT NOT NULL,
    "nota"         INTEGER NOT NULL,
    "comentario"   TEXT,
    "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoConsulta_pkey" PRIMARY KEY ("id")
);

-- Índice único: uma avaliação por consulta (OWASP A08 — idempotência)
CREATE UNIQUE INDEX "AvaliacaoConsulta_consultaId_key" ON "AvaliacaoConsulta"("consultaId");

-- Índice por clienteId: consultas de avaliações de um cliente específico
CREATE INDEX "AvaliacaoConsulta_clienteId_idx" ON "AvaliacaoConsulta"("clienteId");

-- FK: AvaliacaoConsulta → Consulta
ALTER TABLE "AvaliacaoConsulta" ADD CONSTRAINT "AvaliacaoConsulta_consultaId_fkey"
    FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK: AvaliacaoConsulta → Client
ALTER TABLE "AvaliacaoConsulta" ADD CONSTRAINT "AvaliacaoConsulta_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
