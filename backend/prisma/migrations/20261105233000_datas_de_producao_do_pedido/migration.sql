-- AlterTable
ALTER TABLE "pedido" ADD COLUMN     "concluido_em" TIMESTAMP(3),
ADD COLUMN     "iniciado_em" TIMESTAMP(3);

-- Pedidos ja concluidos usam a ultima atualizacao como data de conclusao
UPDATE "pedido" SET "concluido_em" = "atualizado_em" WHERE "status" IN ('CONCLUIDO', 'FATURADO');
