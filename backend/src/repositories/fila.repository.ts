import { PrismaTenantClient } from "../lib/prisma-tenant";

const dadosListagem = { cliente: true, material: true };

export type StatusFila = "EM_PRODUCAO" | "CONCLUIDO";

export type RetrabalhoInput = {
  pedidoId: string;
  motivo: string;
  custoOperacional: number;
  garantia: boolean;
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
        where: { maquinaId, status: "CONCLUIDO" },
        include: dadosListagem,
        orderBy: { atualizadoEm: "desc" },
        take: 10,
      });
    },

    atualizarStatus(id: string, status: StatusFila) {
      return prisma.pedido.update({
        where: { id },
        data: status === "CONCLUIDO" ? { status, posicaoFila: null } : { status },
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
        prisma.pedido.update({ where: { id: dados.pedidoId }, data: { status: "RETRABALHO" } }),
      ]);
    },
  };
}
