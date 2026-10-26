import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type ServicoAdicionalCriarInput = Omit<Prisma.ServicoAdicionalUncheckedCreateInput, "organizacaoId">;
export type ServicoAdicionalAtualizarInput = Omit<Prisma.ServicoAdicionalUncheckedUpdateInput, "organizacaoId">;

export function servicoAdicionalRepository(prisma: PrismaTenantClient) {
  return {
    criar(dados: ServicoAdicionalCriarInput) {
      return prisma.servicoAdicional.create({ data: dados as Prisma.ServicoAdicionalUncheckedCreateInput });
    },

    listar() {
      return prisma.servicoAdicional.findMany({ orderBy: { descricao: "asc" } });
    },

    buscarPorId(id: string) {
      return prisma.servicoAdicional.findUnique({ where: { id } });
    },

    atualizar(id: string, dados: ServicoAdicionalAtualizarInput) {
      return prisma.servicoAdicional.update({
        where: { id },
        data: dados as Prisma.ServicoAdicionalUncheckedUpdateInput,
      });
    },

    remover(id: string) {
      return prisma.servicoAdicional.delete({ where: { id } });
    },
  };
}
