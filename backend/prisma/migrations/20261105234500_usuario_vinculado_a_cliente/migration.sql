-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "cliente_id" TEXT;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_organizacao_id_cliente_id_fkey" FOREIGN KEY ("organizacao_id", "cliente_id") REFERENCES "cliente"("organizacao_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

