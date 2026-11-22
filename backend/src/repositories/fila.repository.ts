import type { StatusPedido } from "../generated/prisma/enums";
import type { PrismaTenantClient } from "../lib/prisma-tenant";

const dadosListagem = { cliente: true, material: true };

export type StatusFila = "NA_FILA" | "EM_PRODUCAO" | "CONCLUIDO";

export type RetrabalhoInput = {
  pedidoId: string;
  motivo: string;
  custoOperacional: number;
  statusOrigem: "CONCLUIDO" | "FATURADO";
};

export function filaRepository(prisma: PrismaTenantClient) {
  return {
    listarFila(maquinaId: string) {
      return prisma.pedido.findMany({
        where: { maquinaId, status: { in: ["NA_FILA", "EM_PRODUCAO", "RETRABALHO"] } },
        include: dadosListagem,
        orderBy: [{ posicaoFila: { sort: "asc", nulls: "last" } }, { prazoEntrega: "asc" }, { criadoEm: "asc" }],
      });
    },

    listarConcluidos(maquinaId: string) {
      return prisma.pedido.findMany({
        where: { maquinaId, status: { in: ["CONCLUIDO", "FATURADO"] } },
        include: dadosListagem,
        orderBy: { atualizadoEm: "desc" },
        take: 10,
      });
    },

    // As tres mudancas de status so gravam se o pedido ainda estiver no status lido antes.
    // Com dois operadores clicando juntos, o segundo recebe count 0 em vez de passar por cima.
    iniciarProducao(id: string, statusAtual: StatusPedido, iniciadoEm: Date) {
      return prisma.pedido.updateMany({ where: { id, status: statusAtual }, data: { status: "EM_PRODUCAO", iniciadoEm } });
    },

    voltarParaFila(id: string, statusAtual: StatusPedido, status: "NA_FILA" | "RETRABALHO", iniciadoEm: Date | null) {
      return prisma.pedido.updateMany({ where: { id, status: statusAtual }, data: { status, iniciadoEm } });
    },

    concluir(id: string, statusAtual: StatusPedido, status: "CONCLUIDO" | "FATURADO", concluidoEm: Date) {
      return prisma.pedido.updateMany({
        where: { id, status: statusAtual },
        data: { status, posicaoFila: null, concluidoEm },
      });
    },

    definirOrdem(idsEmOrdem: string[]) {
      return prisma.$transaction(
        idsEmOrdem.map((id, posicao) => prisma.pedido.update({ where: { id }, data: { posicaoFila: posicao } })),
      );
    },

    registrarRetrabalho(dados: RetrabalhoInput) {
      return prisma.$transaction(async (tx) => {
        const { count } = await tx.pedido.updateMany({
          where: { id: dados.pedidoId, status: dados.statusOrigem },
          data: { status: "RETRABALHO", posicaoFila: null },
        });
        if (count === 1) {
          await tx.retrabalho.create({ data: dados });
        }
        return count;
      });
    },
  };
}
