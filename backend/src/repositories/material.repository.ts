import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type MaterialCriarInput = Omit<Prisma.MaterialUncheckedCreateInput, "organizacaoId">;
export type MaterialAtualizarInput = Omit<Prisma.MaterialUncheckedUpdateInput, "organizacaoId">;

export function materialRepository(prisma: PrismaTenantClient) {
  return {
    criar(dados: MaterialCriarInput) {
      return prisma.material.create({ data: dados as Prisma.MaterialUncheckedCreateInput });
    },

    listar() {
      return prisma.material.findMany({ orderBy: { tipo: "asc" } });
    },

    buscarPorId(id: string) {
      return prisma.material.findUnique({ where: { id } });
    },

    atualizar(id: string, dados: MaterialAtualizarInput) {
      return prisma.material.update({ where: { id }, data: dados as Prisma.MaterialUncheckedUpdateInput });
    },

    remover(id: string) {
      return prisma.material.delete({ where: { id } });
    },
  };
}
