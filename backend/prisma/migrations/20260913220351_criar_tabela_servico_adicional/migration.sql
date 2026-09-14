-- CreateTable
CREATE TABLE "servico_adicional" (
    "id" TEXT NOT NULL,
    "organizacao_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_padrao" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servico_adicional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "servico_adicional" ADD CONSTRAINT "servico_adicional_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
