import type { PrismaTenantClient } from "../lib/prisma-tenant";

export type Periodo = { inicio: Date; fim: Date };

export class ContaAlteradaError extends Error {}

export function faturamentoRepository(prisma: PrismaTenantClient) {
  return {
    // A conta pega tudo que esta em aberto ate o fim do periodo, nao so o que foi concluido dentro dele:
    // um pedido refeito volta com a data da primeira conclusao, que pode cair num mes ja fechado.
    listarContaAberta(clienteId: string, { fim }: Periodo) {
      return prisma.pedido.findMany({
        where: {
          clienteId,
          formaPagamento: "EM_CONTA",
          status: "CONCLUIDO",
          concluidoEm: { lte: fim },
        },
        include: { cliente: true, material: true },
        orderBy: { concluidoEm: "asc" },
      });
    },

    listarContasAbertas({ fim }: Periodo) {
      return prisma.pedido.findMany({
        where: { formaPagamento: "EM_CONTA", status: "CONCLUIDO", concluidoEm: { lte: fim } },
        include: { cliente: true },
      });
    },

    // Tudo ou nada: se algum pedido mudou depois da leitura (clique duplo, retrabalho no meio),
    // nada e faturado e o comprovante nao sai com pedido que nao foi cobrado.
    marcarFaturados(ids: string[]) {
      return prisma.$transaction(async (tx) => {
        const { count } = await tx.pedido.updateMany({
          where: { id: { in: ids }, status: "CONCLUIDO" },
          data: { status: "FATURADO" },
        });
        if (count !== ids.length) {
          throw new ContaAlteradaError();
        }
      });
    },

    listarConcluidos({ inicio, fim }: Periodo) {
      return prisma.pedido.findMany({
        where: { concluidoEm: { gte: inicio, lte: fim } },
        include: { cliente: true, material: true, maquina: true, _count: { select: { retrabalhos: true } } },
        orderBy: { concluidoEm: "desc" },
      });
    },

    listarComRetrabalho({ inicio, fim }: Periodo) {
      const noPeriodo = { criadoEm: { gte: inicio, lte: fim } };
      return prisma.pedido.findMany({
        where: { retrabalhos: { some: noPeriodo } },
        include: { cliente: true, material: true, retrabalhos: { where: noPeriodo } },
      });
    },
  };
}
