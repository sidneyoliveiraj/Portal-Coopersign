import { PrismaTenantClient } from "../lib/prisma-tenant";

export type Periodo = { inicio: Date; fim: Date };

export function faturamentoRepository(prisma: PrismaTenantClient) {
  return {
    listarContaAberta(clienteId: string, { inicio, fim }: Periodo) {
      return prisma.pedido.findMany({
        where: {
          clienteId,
          formaPagamento: "EM_CONTA",
          status: "CONCLUIDO",
          concluidoEm: { gte: inicio, lte: fim },
        },
        include: { cliente: true, material: true },
        orderBy: { concluidoEm: "asc" },
      });
    },

    marcarFaturados(ids: string[]) {
      return prisma.pedido.updateMany({
        where: { id: { in: ids }, status: "CONCLUIDO" },
        data: { status: "FATURADO" },
      });
    },

    listarConcluidos({ inicio, fim }: Periodo) {
      return prisma.pedido.findMany({
        where: { status: { in: ["CONCLUIDO", "FATURADO"] }, concluidoEm: { gte: inicio, lte: fim } },
        include: { cliente: true, material: true, maquina: true },
        orderBy: { concluidoEm: "desc" },
      });
    },

    listarComRetrabalho({ inicio, fim }: Periodo) {
      const noPeriodo = { criadoEm: { gte: inicio, lte: fim } };
      return prisma.pedido.findMany({
        where: { retrabalhos: { some: noPeriodo } },
        include: { retrabalhos: { where: noPeriodo } },
      });
    },
  };
}
