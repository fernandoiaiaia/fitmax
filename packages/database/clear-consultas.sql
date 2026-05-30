-- Limpa consultas para testes
-- ATENÇÃO: apaga permanentemente todos os registros de consultas
-- Usuários, profissionais e slots de disponibilidade NÃO são apagados

-- 1. Remove avaliações (FK → Consulta)
DELETE FROM "AvaliacaoConsulta";

-- 2. Remove repasses (FK → Consulta)
DELETE FROM "Repasse";

-- 3. Remove as consultas
DELETE FROM "Consulta";
