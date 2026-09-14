import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type ClienteCriarInput = Omit<Prisma.ClienteUncheckedCreateInput, "organizacaoId">;
export type ClienteAtualizarInput = Omit<Prisma.ClienteUncheckedUpdateInput, "organizacaoId">;

export function clienteRepository(prisma: PrismaTenantClient) {
  return {
    criar(dados: ClienteCriarInput) {
      return prisma.cliente.create({ data: dados as Prisma.ClienteUncheckedCreateInput });
    },

    listar() {
      return prisma.cliente.findMany({ orderBy: { nome: "asc" } });
    },

    buscarPorId(id: string) {
      return prisma.cliente.findUnique({ where: { id } });
    },

    atualizar(id: string, dados: ClienteAtualizarInput) {
      return prisma.cliente.update({ where: { id }, data: dados as Prisma.ClienteUncheckedUpdateInput });
    },

    remover(id: string) {
      return prisma.cliente.delete({ where: { id } });
    },
  };
}
