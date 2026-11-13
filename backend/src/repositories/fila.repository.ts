import { PrismaTenantClient } from "../lib/prisma-tenant";

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

    iniciarProducao(id: string, iniciadoEm: Date) {
      return prisma.pedido.update({ where: { id }, data: { status: "EM_PRODUCAO", iniciadoEm } });
    },

    voltarParaFila(id: string, status: "NA_FILA" | "RETRABALHO", iniciadoEm: Date | null) {
      return prisma.pedido.update({ where: { id }, data: { status, iniciadoEm } });
    },

    concluir(id: string, status: "CONCLUIDO" | "FATURADO", concluidoEm: Date) {
      return prisma.pedido.update({
        where: { id },
        data: { status, posicaoFila: null, concluidoEm },
      });
    },

    definirOrdem(idsEmOrdem: string[]) {
      return prisma.$transaction(
        idsEmOrdem.map((id, posicao) => prisma.pedido.update({ where: { id }, data: { posicaoFila: posicao } })),
      );
    },

    registrarRetrabalho(dados: RetrabalhoInput) {
      return prisma.$transaction([
        prisma.retrabalho.create({ data: dados }),
        prisma.pedido.update({ where: { id: dados.pedidoId }, data: { status: "RETRABALHO", posicaoFila: null } }),
      ]);
    },
  };
}
