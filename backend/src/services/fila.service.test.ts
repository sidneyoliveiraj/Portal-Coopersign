import { describe, it, expect, vi, beforeEach } from "vitest";
import { filaService } from "./fila.service";
import { PedidoInvalidoError, PedidoNaoEncontradoError } from "./pedido.service";
import { MaquinaNaoEncontradaError } from "./maquina.service";
import { PrismaTenantClient } from "../lib/prisma-tenant";

function criarPrismaFalso() {
  return {
    maquina: { findUnique: vi.fn().mockResolvedValue({ id: "maq-1" }) },
    pedido: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ id: "ped-1", status: "NA_FILA", maquinaId: "maq-1" }),
      update: vi.fn(),
    },
    retrabalho: { create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  };
}

describe("filaService", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;
  let service: ReturnType<typeof filaService>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
    service = filaService(prisma as unknown as PrismaTenantClient);
  });

  describe("listar", () => {
    it("ordena a fila pela posicao manual e depois pelo prazo (RN11)", async () => {
      await service.listar("maq-1");

      expect(prisma.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { maquinaId: "maq-1", status: { in: ["NA_FILA", "EM_PRODUCAO", "RETRABALHO"] } },
          orderBy: [{ posicaoFila: { sort: "asc", nulls: "last" } }, { prazoEntrega: "asc" }, { criadoEm: "asc" }],
        }),
      );
    });

    it("retorna erro para maquina de outra organizacao", async () => {
      prisma.maquina.findUnique.mockResolvedValue(null);

      await expect(service.listar("maq-x")).rejects.toThrow(MaquinaNaoEncontradaError);
    });
  });

  describe("atualizarStatus", () => {
    it("inicia a producao de um pedido na fila", async () => {
      await service.atualizarStatus("ped-1", { status: "EM_PRODUCAO" });

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: "ped-1" },
        data: { status: "EM_PRODUCAO" },
      });
    });

    it("ao concluir tira o pedido da ordem manual", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "EM_PRODUCAO" });
      await service.atualizarStatus("ped-1", { status: "CONCLUIDO" });

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: "ped-1" },
        data: { status: "CONCLUIDO", posicaoFila: null },
      });
    });

    it("nao pula etapa de producao", async () => {
      await expect(service.atualizarStatus("ped-1", { status: "CONCLUIDO" })).rejects.toThrow(PedidoInvalidoError);
      expect(prisma.pedido.update).not.toHaveBeenCalled();
    });

    it.each(["FATURADO", "constructor", undefined])("rejeita status invalido: %s", async (status) => {
      await expect(service.atualizarStatus("ped-1", { status })).rejects.toThrow(
        "status deve ser EM_PRODUCAO ou CONCLUIDO",
      );
    });

    it("retorna nao encontrado para pedido de outra organizacao", async () => {
      prisma.pedido.findUnique.mockResolvedValue(null);

      await expect(service.atualizarStatus("ped-x", { status: "EM_PRODUCAO" })).rejects.toThrow(
        PedidoNaoEncontradoError,
      );
    });
  });

  describe("registrarRetrabalho", () => {
    it("exige motivo (RN05)", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "EM_PRODUCAO" });

      await expect(service.registrarRetrabalho("ped-1", { custoOperacional: 10 })).rejects.toThrow(
        "motivo e obrigatorio",
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("exige custo operacional valido", async () => {
      await expect(
        service.registrarRetrabalho("ped-1", { motivo: "cor errada", custoOperacional: -1 }),
      ).rejects.toThrow("custoOperacional deve ser um numero maior ou igual a zero");
    });

    it.each([undefined, null, ""])("aceita retrabalho de producao sem custo (%s)", async (custoOperacional) => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "EM_PRODUCAO" });
      await service.registrarRetrabalho("ped-1", { motivo: "bateu a cabeca", custoOperacional });

      expect(prisma.retrabalho.create).toHaveBeenCalledWith({
        data: { pedidoId: "ped-1", motivo: "bateu a cabeca", custoOperacional: null, garantia: false },
      });
    });

    it("exige custo no retrabalho de garantia (RN06)", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "CONCLUIDO" });

      await expect(service.registrarRetrabalho("ped-1", { motivo: "descolou", garantia: true })).rejects.toThrow(
        "custoOperacional e obrigatorio em retrabalho de garantia",
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("registra retrabalho de producao e volta o pedido para a fila", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "EM_PRODUCAO" });
      await service.registrarRetrabalho("ped-1", { motivo: "cor errada", custoOperacional: 25.5 });

      expect(prisma.retrabalho.create).toHaveBeenCalledWith({
        data: { pedidoId: "ped-1", motivo: "cor errada", custoOperacional: 25.5, garantia: false },
      });
      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: "ped-1" },
        data: { status: "RETRABALHO" },
      });
    });

    it("registra garantia sem alterar o valor do pedido (RN06)", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "CONCLUIDO" });
      await service.registrarRetrabalho("ped-1", { motivo: "descolou", custoOperacional: 40, garantia: true });

      expect(prisma.retrabalho.create).toHaveBeenCalledWith({
        data: { pedidoId: "ped-1", motivo: "descolou", custoOperacional: 40, garantia: true },
      });
      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: "ped-1" },
        data: { status: "RETRABALHO" },
      });
    });

    it("nao aceita garantia em pedido que ainda nao foi concluido", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "EM_PRODUCAO" });

      await expect(
        service.registrarRetrabalho("ped-1", { motivo: "descolou", custoOperacional: 40, garantia: true }),
      ).rejects.toThrow(PedidoInvalidoError);
    });
  });

  describe("mover", () => {
    beforeEach(() => {
      prisma.pedido.findMany.mockResolvedValue([{ id: "ped-0" }, { id: "ped-1" }, { id: "ped-2" }]);
    });

    function ordemGravada() {
      return prisma.pedido.update.mock.calls.map(([args]) => [args.where.id, args.data.posicaoFila]);
    }

    it("leva o ultimo pedido direto para a primeira posicao (RF23)", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-2", status: "NA_FILA", maquinaId: "maq-1" });

      await service.mover("ped-2", { posicao: 1 });

      expect(ordemGravada()).toEqual([
        ["ped-2", 0],
        ["ped-0", 1],
        ["ped-1", 2],
      ]);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("leva o primeiro pedido para o meio da fila", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-0", status: "NA_FILA", maquinaId: "maq-1" });

      await service.mover("ped-0", { posicao: 2 });

      expect(ordemGravada()).toEqual([
        ["ped-1", 0],
        ["ped-0", 1],
        ["ped-2", 2],
      ]);
    });

    it("posicao maior que a fila leva o pedido para o fim", async () => {
      await service.mover("ped-1", { posicao: 99 });

      expect(ordemGravada()).toEqual([
        ["ped-0", 0],
        ["ped-2", 1],
        ["ped-1", 2],
      ]);
    });

    it("nao faz nada se o pedido ja esta na posicao", async () => {
      await service.mover("ped-1", { posicao: 2 });

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejeita pedido que nao esta na fila", async () => {
      prisma.pedido.findUnique.mockResolvedValue({ id: "ped-9", status: "CONCLUIDO", maquinaId: "maq-1" });

      await expect(service.mover("ped-9", { posicao: 1 })).rejects.toThrow("pedido nao esta em uma fila");
    });

    it.each([0, -1, 1.5, "1", undefined])("rejeita posicao invalida: %s", async (posicao) => {
      await expect(service.mover("ped-1", { posicao })).rejects.toThrow("posicao deve ser um numero inteiro");
    });
  });
});
