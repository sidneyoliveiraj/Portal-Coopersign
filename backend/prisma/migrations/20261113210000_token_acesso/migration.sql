-- CreateEnum
CREATE TYPE "TipoTokenAcesso" AS ENUM ('CONVITE', 'RECUPERACAO');

-- CreateTable
CREATE TABLE "token_acesso" (
    "id" TEXT NOT NULL,
    "organizacao_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoTokenAcesso" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_acesso_token_hash_key" ON "token_acesso"("token_hash");

-- AddForeignKey
ALTER TABLE "token_acesso" ADD CONSTRAINT "token_acesso_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_acesso" ADD CONSTRAINT "token_acesso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

