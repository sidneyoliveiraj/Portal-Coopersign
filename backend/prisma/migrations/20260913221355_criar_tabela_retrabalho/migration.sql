-- CreateTable
CREATE TABLE "retrabalho" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "custo_operacional" DECIMAL(10,2) NOT NULL,
    "garantia" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrabalho_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "retrabalho" ADD CONSTRAINT "retrabalho_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
