-- CreateTable
CREATE TABLE "organizacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizacao_pkey" PRIMARY KEY ("id")
);
