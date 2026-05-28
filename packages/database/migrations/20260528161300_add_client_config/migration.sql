-- Migration: add_client_config
-- Adiciona campo objetivo ao Client e cria tabela ClientNotifPrefs

-- Campo objetivo no Client (OWASP A03 — enum validado no service via Zod)
ALTER TABLE "Client" ADD COLUMN "objetivo" TEXT;

-- Tabela ClientNotifPrefs — preferências de notificação do paciente (1:1 com Client)
-- OWASP A08 — @id = clienteId garante exatamente um registro por cliente (idempotência)
CREATE TABLE "ClientNotifPrefs" (
    "clienteId"          TEXT    NOT NULL,
    "confirmacao"        BOOLEAN NOT NULL DEFAULT true,
    "lembrete"           BOOLEAN NOT NULL DEFAULT true,
    "cancelamento"       BOOLEAN NOT NULL DEFAULT true,
    "novosProfissionais" BOOLEAN NOT NULL DEFAULT false,
    "dicas"              BOOLEAN NOT NULL DEFAULT false,
    "canalEmail"         BOOLEAN NOT NULL DEFAULT true,
    "canalWhatsapp"      BOOLEAN NOT NULL DEFAULT false,
    "canalPush"          BOOLEAN NOT NULL DEFAULT true,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNotifPrefs_pkey" PRIMARY KEY ("clienteId")
);

-- FK: ClientNotifPrefs → Client
ALTER TABLE "ClientNotifPrefs" ADD CONSTRAINT "ClientNotifPrefs_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
