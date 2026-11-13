-- Remove o status RASCUNHO, que nunca foi usado: todo pedido nasce em
-- AGUARDANDO_VALIDACAO, que passa a ser tambem o valor padrao da coluna.
BEGIN;
CREATE TYPE "StatusPedido_new" AS ENUM ('AGUARDANDO_VALIDACAO', 'NA_FILA', 'EM_PRODUCAO', 'CONCLUIDO', 'RETRABALHO', 'FATURADO', 'REJEITADO');
ALTER TABLE "pedido" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "pedido" ALTER COLUMN "status" TYPE "StatusPedido_new" USING ("status"::text::"StatusPedido_new");
ALTER TYPE "StatusPedido" RENAME TO "StatusPedido_old";
ALTER TYPE "StatusPedido_new" RENAME TO "StatusPedido";
DROP TYPE "StatusPedido_old";
ALTER TABLE "pedido" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO_VALIDACAO';
COMMIT;
