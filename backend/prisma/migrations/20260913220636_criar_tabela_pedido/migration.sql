-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('RASCUNHO', 'AGUARDANDO_VALIDACAO', 'EM_PRODUCAO', 'CONCLUIDO', 'FATURADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('A_VISTA', 'EM_CONTA');

-- CreateTable
CREATE TABLE "pedido" (
    "id" TEXT NOT NULL,
    "organizacao_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "maquina_id" TEXT,
    "status" "StatusPedido" NOT NULL DEFAULT 'RASCUNHO',
    "largura" DECIMAL(10,2) NOT NULL,
    "altura" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "acabamento" TEXT NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "forma_pagamento" "FormaPagamento" NOT NULL DEFAULT 'A_VISTA',
    "prazo_entrega" TIMESTAMP(3) NOT NULL,
    "metragem_total" DECIMAL(10,2) NOT NULL,
    "valor_base" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquina"("id") ON DELETE SET NULL ON UPDATE CASCADE;
