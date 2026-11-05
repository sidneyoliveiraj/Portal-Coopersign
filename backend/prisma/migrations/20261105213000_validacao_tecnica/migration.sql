-- AlterEnum
ALTER TYPE "StatusPedido" ADD VALUE 'NA_FILA';

-- AlterTable
ALTER TABLE "pedido" ADD COLUMN     "motivo_rejeicao" TEXT,
ADD COLUMN     "observacao_tecnica" TEXT;

