import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type MaquinaCriarInput = Omit<Prisma.MaquinaUncheckedCreateInput, "organizacaoId">;
export type MaquinaAtualizarInput = Omit<Prisma.MaquinaUncheckedUpdateInput, "organizacaoId">;

export function maquinaRepository(prisma: PrismaTenantClient) {
  return {
    criar(dados: MaquinaCriarInput) {
      return prisma.maquina.create({ data: dados as Prisma.MaquinaUncheckedCreateInput });
    },

    listar() {
      return prisma.maquina.findMany({ orderBy: { nome: "asc" } });
    },

    buscarPorId(id: string) {
      return prisma.maquina.findUnique({ where: { id } });
    },

    atualizar(id: string, dados: MaquinaAtualizarInput) {
      return prisma.maquina.update({ where: { id }, data: dados as Prisma.MaquinaUncheckedUpdateInput });
    },

    remover(id: string) {
      return prisma.maquina.delete({ where: { id } });
    },
  };
}
