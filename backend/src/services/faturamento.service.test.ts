import { describe, it, expect, vi, beforeEach } from "vitest";
import { faturamentoService, FaturamentoInvalidoError } from "./faturamento.service";
import { PrismaTenantClient } from "../lib/prisma-tenant";

const periodoValido = { inicio: "2026-11-01", fim: "2026-11-30" };

function criarPrismaFalso() {
  return {
    cliente: { findUnique: vi.fn().mockResolvedValue({ id: "cli-1" }) },
    pedido: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe("faturamentoService", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;
  let service: ReturnType<typeof faturamentoService>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
    service = faturamentoService(prisma as unknown as PrismaTenantClient);
  });

  describe("contaAberta (RF24, RN08)", () => {
    it("busca so pedidos em conta concluidos do cliente no periodo", async () => {
      prisma.pedido.findMany.mockResolvedValue([{ valorTotal: "100.10" }, { valorTotal: "50.20" }]);

      const conta = await service.contaAberta({ clienteId: "cli-1", ...periodoValido });

      expect(conta.total).toBe(150.3);
      expect(prisma.pedido.findMany.mock.calls[0][0].where).toMatchObject({
        clienteId: "cli-1",
        formaPagamento: "EM_CONTA",
        status: "CONCLUIDO",
      });
    });

    it("usa o dia inteiro no fuso do Brasil", async () => {
      await service.contaAberta({ clienteId: "cli-1", inicio: "2026-11-05", fim: "2026-11-05" });

      const { concluidoEm } = prisma.pedido.findMany.mock.calls[0][0].where;
      expect(concluidoEm.gte.toISOString()).toBe("2026-11-05T03:00:00.000Z");
      expect(concluidoEm.lte.toISOString()).toBe("2026-11-06T02:59:59.999Z");
    });

    it.each([
      [{ inicio: "05/11/2026", fim: "2026-11-30" }],
      [{ inicio: "2026-11-30", fim: "2026-11-01" }],
      [{ fim: "2026-11-30" }],
    ])("rejeita periodo invalido %j", async (intervalo) => {
      await expect(service.contaAberta({ clienteId: "cli-1", ...intervalo })).rejects.toThrow(FaturamentoInvalidoError);
    });

    it("rejeita cliente de outra organizacao", async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.contaAberta({ clienteId: "cli-x", ...periodoValido })).rejects.toThrow(
        "cliente nao encontrado",
      );
    });
  });

  describe("fecharConta", () => {
    it("marca os pedidos do periodo como faturados", async () => {
      prisma.pedido.findMany.mockResolvedValue([
        { id: "ped-1", valorTotal: "100" },
        { id: "ped-2", valorTotal: "50" },
      ]);

      const fechamento = await service.fecharConta({ clienteId: "cli-1", ...periodoValido });

      expect(fechamento).toMatchObject({ quantidade: 2, total: 150 });
      expect(prisma.pedido.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["ped-1", "ped-2"] }, status: "CONCLUIDO" },
        data: { status: "FATURADO" },
      });
    });

    it("nao fecha conta vazia", async () => {
      await expect(service.fecharConta({ clienteId: "cli-1", ...periodoValido })).rejects.toThrow(
        "nao ha pedidos em conta concluidos neste periodo",
      );
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("indicadores (RF25, RF27, RF28, RN09)", () => {
    it("soma receita de todas as formas de pagamento e calcula os indicadores", async () => {
      const inicio = new Date("2026-11-02T10:00:00Z");
      prisma.pedido.findMany
        .mockResolvedValueOnce([
          {
            valorTotal: "100",
            formaPagamento: "A_VISTA",
            maquina: { nome: "Roland" },
            iniciadoEm: inicio,
            concluidoEm: new Date("2026-11-02T12:00:00Z"),
          },
          {
            valorTotal: "50.5",
            formaPagamento: "EM_CONTA",
            maquina: { nome: "Roland" },
            iniciadoEm: inicio,
            concluidoEm: new Date("2026-11-02T14:00:00Z"),
          },
        ])
        .mockResolvedValueOnce([
          {
            retrabalhos: [
              { garantia: false, custoOperacional: null },
              { garantia: false, custoOperacional: "30" },
              { garantia: true, custoOperacional: "80" },
            ],
          },
        ]);

      const resultado = await service.indicadores(periodoValido);

      expect(resultado.receitaTotal).toBe(150.5);
      expect(resultado.receitaPorForma).toEqual({ A_VISTA: 100, EM_CONTA: 50.5 });
      expect(resultado.pedidosPorMaquina).toEqual([{ maquina: "Roland", quantidade: 2 }]);
      expect(resultado.tempoMedioHoras).toBe(3);
      expect(resultado.taxaRetrabalho).toBe(150);
      expect(resultado.retrabalhoProducao).toEqual({ quantidade: 2, custoInformado: 30, semCusto: 1 });
      expect(resultado.retrabalhoGarantia).toEqual({ quantidade: 1, custoInformado: 80, semCusto: 0 });
    });

    it("nao divide por zero sem pedidos concluidos", async () => {
      const resultado = await service.indicadores(periodoValido);

      expect(resultado.taxaRetrabalho).toBeNull();
      expect(resultado.tempoMedioHoras).toBeNull();
    });
  });
});
