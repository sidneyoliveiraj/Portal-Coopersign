-- CreateTable
CREATE TABLE "pedido_servico" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "servico_adicional_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pedido_servico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pedido_servico" ADD CONSTRAINT "pedido_servico_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_servico" ADD CONSTRAINT "pedido_servico_servico_adicional_id_fkey" FOREIGN KEY ("servico_adicional_id") REFERENCES "servico_adicional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
