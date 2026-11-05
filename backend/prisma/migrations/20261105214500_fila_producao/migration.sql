-- AlterEnum
ALTER TYPE "StatusPedido" ADD VALUE 'RETRABALHO';

-- AlterTable
ALTER TABLE "pedido" ADD COLUMN     "posicao_fila" INTEGER;

