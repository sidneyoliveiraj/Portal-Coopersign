-- Retrabalho passa a ser um tipo so: erro da Coopersign, sem cobranca ao
-- cliente, com custo obrigatorio. status_origem guarda se o pedido estava
-- CONCLUIDO ou FATURADO, para voltar a esse status quando for refeito.
BEGIN;
ALTER TABLE "retrabalho" ADD COLUMN "status_origem" "StatusPedido";
UPDATE "retrabalho" SET "status_origem" = 'CONCLUIDO';
ALTER TABLE "retrabalho" ALTER COLUMN "status_origem" SET NOT NULL;
UPDATE "retrabalho" SET "custo_operacional" = 0 WHERE "custo_operacional" IS NULL;
ALTER TABLE "retrabalho" ALTER COLUMN "custo_operacional" SET NOT NULL;
ALTER TABLE "retrabalho" DROP COLUMN "garantia";
COMMIT;
