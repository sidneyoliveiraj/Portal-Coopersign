-- DropForeignKey
ALTER TABLE "pedido" DROP CONSTRAINT "pedido_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "pedido" DROP CONSTRAINT "pedido_maquina_id_fkey";

-- DropForeignKey
ALTER TABLE "pedido" DROP CONSTRAINT "pedido_material_id_fkey";

-- DropIndex
DROP INDEX "usuario_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "cliente_organizacao_id_id_key" ON "cliente"("organizacao_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "maquina_organizacao_id_id_key" ON "maquina"("organizacao_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "material_organizacao_id_id_key" ON "material"("organizacao_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_organizacao_id_email_key" ON "usuario"("organizacao_id", "email");

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_organizacao_id_cliente_id_fkey" FOREIGN KEY ("organizacao_id", "cliente_id") REFERENCES "cliente"("organizacao_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_organizacao_id_material_id_fkey" FOREIGN KEY ("organizacao_id", "material_id") REFERENCES "material"("organizacao_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_organizacao_id_maquina_id_fkey" FOREIGN KEY ("organizacao_id", "maquina_id") REFERENCES "maquina"("organizacao_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

