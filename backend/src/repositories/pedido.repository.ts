import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type PedidoCriarInput = Omit<Prisma.PedidoUncheckedCreateInput, "organizacaoId">;

const detalhesPedido = {
  cliente: true,
  material: true,
  pedidoServicos: { include: { servicoAdicional: true } },
  ajustesValor: { orderBy: { criadoEm: "asc" } },
} satisfies Prisma.PedidoInclude;

export function pedidoRepository(prisma: PrismaTenantClient) {
  return {
    criar(dados: PedidoCriarInput) {
      return prisma.pedido.create({
        data: dados as Prisma.PedidoUncheckedCreateInput,
        include: detalhesPedido,
      });
    },

    listar() {
      return prisma.pedido.findMany({
        include: { cliente: true, material: true },
        orderBy: { criadoEm: "desc" },
      });
    },

    buscarPorId(id: string) {
      return prisma.pedido.findUnique({ where: { id }, include: detalhesPedido });
    },

    registrarAjuste(pedidoId: string, descricao: string, valor: number, novoValorTotal: number) {
      return prisma.$transaction([
        prisma.ajusteValor.create({ data: { pedidoId, descricao, valor } }),
        prisma.pedido.update({ where: { id: pedidoId }, data: { valorTotal: novoValorTotal } }),
      ]);
    },
  };
}
