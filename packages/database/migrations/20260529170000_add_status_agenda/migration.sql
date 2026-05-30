-- Migration: add_status_agenda
-- Adiciona o enum ConsultaStatusAgenda e o campo statusAgenda ao model Consulta.
-- O statusAgenda é derivado do status financeiro existente nos dados já gravados.
-- Isso resolve o bug onde consultas canceladas (ESTORNO) sumiam da visão do cliente.

-- 1. Cria o enum
CREATE TYPE "ConsultaStatusAgenda" AS ENUM ('AGENDADA', 'CONFIRMADA', 'CANCELADA', 'CONCLUIDA');

-- 2. Adiciona a coluna com default AGENDADA (para não travar a tabela)
ALTER TABLE "Consulta" ADD COLUMN "statusAgenda" "ConsultaStatusAgenda" NOT NULL DEFAULT 'AGENDADA';

-- 3. Migra os dados existentes: deriva statusAgenda do status financeiro atual
UPDATE "Consulta" SET "statusAgenda" = CASE
  WHEN status = 'PAGO'    THEN 'CONFIRMADA'::"ConsultaStatusAgenda"
  WHEN status = 'ESTORNO' THEN 'CANCELADA'::"ConsultaStatusAgenda"
  ELSE                         'AGENDADA'::"ConsultaStatusAgenda"
END;
