-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "organizacao_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "preco_m2" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
