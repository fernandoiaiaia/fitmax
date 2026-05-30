-- Migration: add_ausente_to_status_agenda
-- Adiciona o valor AUSENTE ao enum ConsultaStatusAgenda.
-- Permite registrar quando o cliente não compareceu ao atendimento.
-- NÃO faz DROP — apenas ADD VALUE (seguro em produção, não requer lock de tabela).

ALTER TYPE "ConsultaStatusAgenda" ADD VALUE IF NOT EXISTS 'AUSENTE';
