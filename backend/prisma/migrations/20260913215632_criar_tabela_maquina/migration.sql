-- CreateEnum
CREATE TYPE "StatusMaquina" AS ENUM ('ATIVA', 'EM_MANUTENCAO', 'INATIVA');

-- CreateTable
CREATE TABLE "maquina" (
    "id" TEXT NOT NULL,
    "organizacao_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" "StatusMaquina" NOT NULL DEFAULT 'ATIVA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maquina_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "maquina" ADD CONSTRAINT "maquina_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
