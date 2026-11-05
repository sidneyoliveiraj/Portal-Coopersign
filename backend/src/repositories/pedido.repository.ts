import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type PedidoCriarInput = Omit<Prisma.PedidoUncheckedCreateInput, "organizacaoId">;

const detalhesPedido = {
  cliente: true,
  material: true,
  maquina: true,
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

    listarPendentesValidacao() {
      return prisma.pedido.findMany({
        where: { status: "AGUARDANDO_VALIDACAO" },
        include: { cliente: true, material: true },
        orderBy: { prazoEntrega: "asc" },
      });
    },

    buscarPorId(id: string) {
      return prisma.pedido.findUnique({ where: { id }, include: detalhesPedido });
    },

    aprovar(id: string, maquinaId: string, observacaoTecnica: string | null) {
      return prisma.pedido.update({
        where: { id },
        data: { status: "NA_FILA", maquinaId, observacaoTecnica, motivoRejeicao: null },
        include: detalhesPedido,
      });
    },

    rejeitar(id: string, motivoRejeicao: string, observacaoTecnica: string | null) {
      return prisma.pedido.update({
        where: { id },
        data: { status: "REJEITADO", motivoRejeicao, observacaoTecnica },
        include: detalhesPedido,
      });
    },

    registrarAjuste(pedidoId: string, descricao: string, valor: number, novoValorTotal: number) {
      return prisma.$transaction([
        prisma.ajusteValor.create({ data: { pedidoId, descricao, valor } }),
        prisma.pedido.update({ where: { id: pedidoId }, data: { valorTotal: novoValorTotal } }),
      ]);
    },
  };
}
