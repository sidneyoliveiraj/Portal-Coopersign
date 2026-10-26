-- CreateTable
CREATE TABLE "ajuste_valor" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajuste_valor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ajuste_valor" ADD CONSTRAINT "ajuste_valor_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
