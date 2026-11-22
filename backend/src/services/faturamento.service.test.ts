import { describe, it, expect, vi, beforeEach } from "vitest";
import { faturamentoService, FaturamentoInvalidoError, resumoPorMes } from "./faturamento.service";
import type { PrismaTenantClient } from "../lib/prisma-tenant";

const periodoValido = { inicio: "2026-11-01", fim: "2026-11-30" };

function criarPrismaFalso() {
  return {
    cliente: { findUnique: vi.fn().mockResolvedValue({ id: "cli-1" }) },
    pedido: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn(),
  };
}

describe("faturamentoService", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;
  let service: ReturnType<typeof faturamentoService>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma));
    service = faturamentoService(prisma as unknown as PrismaTenantClient);
  });

  describe("contasAbertas (RF24 por periodo)", () => {
    it("agrupa por cliente, soma e ordena pelo maior total", async () => {
      prisma.pedido.findMany.mockResolvedValue([
        { clienteId: "cli-1", cliente: { nome: "Amais" }, valorTotal: "29" },
        { clienteId: "cli-2", cliente: { nome: "DGM" }, valorTotal: "121.28" },
        { clienteId: "cli-1", cliente: { nome: "Amais" }, valorTotal: "10.10" },
      ]);

      const resultado = await service.contasAbertas(periodoValido);

      expect(resultado.clientes).toEqual([
        { clienteId: "cli-2", nome: "DGM", quantidade: 1, total: 121.28 },
        { clienteId: "cli-1", nome: "Amais", quantidade: 2, total: 39.1 },
      ]);
      expect(resultado.total).toBe(160.38);
      expect(prisma.pedido.findMany.mock.calls[0][0].where).toMatchObject({
        formaPagamento: "EM_CONTA",
        status: "CONCLUIDO",
      });
    });

    it("exige periodo valido", async () => {
      await expect(service.contasAbertas({ inicio: "2026-11-30", fim: "2026-11-01" })).rejects.toThrow(
        FaturamentoInvalidoError,
      );
    });
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

    it("pega tudo que esta em aberto ate o fim do dia no fuso do Brasil", async () => {
      await service.contaAberta({ clienteId: "cli-1", inicio: "2026-11-05", fim: "2026-11-05" });

      const { concluidoEm } = prisma.pedido.findMany.mock.calls[0][0].where;
      expect(concluidoEm).toEqual({ lte: new Date("2026-11-06T02:59:59.999Z") });
    });

    it("inclui pedido refeito que voltou com a data de um mes ja fechado", async () => {
      // concluido em outubro, entrou em retrabalho antes do fechamento e foi refeito em novembro
      prisma.pedido.findMany.mockResolvedValue([{ id: "ped-out", valorTotal: "29", concluidoEm: new Date("2026-10-20") }]);

      const conta = await service.contaAberta({ clienteId: "cli-1", ...periodoValido });

      expect(conta.total).toBe(29);
      expect(prisma.pedido.findMany.mock.calls[0][0].where.concluidoEm).not.toHaveProperty("gte");
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

      prisma.pedido.updateMany.mockResolvedValue({ count: 2 });

      const fechamento = await service.fecharConta({ clienteId: "cli-1", ...periodoValido });

      expect(fechamento).toMatchObject({ quantidade: 2, total: 150 });
      expect(prisma.pedido.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["ped-1", "ped-2"] }, status: "CONCLUIDO" },
        data: { status: "FATURADO" },
      });
    });

    it("nao fecha conta vazia", async () => {
      await expect(service.fecharConta({ clienteId: "cli-1", ...periodoValido })).rejects.toThrow(
        "nao ha pedidos em conta concluidos ate o fim deste periodo",
      );
      expect(prisma.pedido.updateMany).not.toHaveBeenCalled();
    });

    it("clique duplo ou retrabalho no meio: nao fatura nada e nao devolve comprovante", async () => {
      prisma.pedido.findMany.mockResolvedValue([
        { id: "ped-1", valorTotal: "100" },
        { id: "ped-2", valorTotal: "50" },
      ]);
      // so 1 dos 2 pedidos ainda estava CONCLUIDO na hora de gravar
      prisma.pedido.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.fecharConta({ clienteId: "cli-1", ...periodoValido })).rejects.toThrow(
        "a conta mudou enquanto era fechada; busque a conta de novo",
      );
    });
  });

  describe("indicadores (RF25, RF27, RF28, RN09)", () => {
    it("soma receita de todas as formas de pagamento e calcula os indicadores", async () => {
      const inicio = new Date("2026-11-02T10:00:00Z");
      prisma.pedido.findMany
        .mockResolvedValueOnce([
          {
            valorTotal: "100",
            metragemTotal: "2",
            largura: "2",
            altura: "1",
            quantidade: 1,
            material: { tipo: "Lona" },
            formaPagamento: "A_VISTA",
            maquina: { nome: "Roland" },
            iniciadoEm: inicio,
            concluidoEm: new Date("2026-11-02T12:00:00Z"),
            _count: { retrabalhos: 1 },
          },
          {
            valorTotal: "50.5",
            metragemTotal: "1",
            largura: "1",
            altura: "1",
            quantidade: 1,
            material: { tipo: "Lona" },
            formaPagamento: "EM_CONTA",
            maquina: { nome: "Roland" },
            iniciadoEm: inicio,
            concluidoEm: new Date("2026-11-02T14:00:00Z"),
            _count: { retrabalhos: 0 },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "ped-9",
            cliente: { nome: "Amais" },
            material: { tipo: "Lona" },
            retrabalhos: [
              { id: "r-1", criadoEm: new Date("2026-11-03T10:00:00Z"), motivo: "lona rasgou", custoOperacional: "29" },
              { id: "r-2", criadoEm: new Date("2026-11-10T10:00:00Z"), motivo: "cor errada", custoOperacional: "30.5" },
              { id: "r-3", criadoEm: new Date("2026-11-05T10:00:00Z"), motivo: "descolou", custoOperacional: "80" },
            ],
          },
        ]);

      const resultado = await service.indicadores(periodoValido);

      expect(resultado.receitaTotal).toBe(150.5);
      expect(resultado.receitaPorForma).toEqual({ A_VISTA: 100, EM_CONTA: 50.5 });
      expect(resultado.pedidosPorMaquina).toEqual([{ maquina: "Roland", quantidade: 2 }]);
      expect(resultado.tempoMedioHoras).toBe(3);
      // 3 retrabalhos no periodo, mas so 1 dos 2 pedidos concluidos foi refeito: 50%, e nao 150%
      expect(resultado.taxaRetrabalho).toBe(50);
      expect(resultado.custoRetrabalho).toBe(139.5);
      expect(resultado.retrabalhos.map((r) => r.id)).toEqual(["r-2", "r-3", "r-1"]);
      expect(resultado.retrabalhos[0]).toEqual({
        id: "r-2",
        pedidoId: "ped-9",
        data: new Date("2026-11-10T10:00:00Z"),
        cliente: "Amais",
        material: "Lona",
        motivo: "cor errada",
        custo: 30.5,
      });
    });

    it("conta a receita pela data da primeira conclusao, mesmo com o pedido em retrabalho", async () => {
      await service.indicadores(periodoValido);

      expect(prisma.pedido.findMany.mock.calls[0][0].where).toEqual({
        concluidoEm: { gte: expect.any(Date), lte: expect.any(Date) },
      });
    });

    it("soma pedidos e metragem por material, com o mais usado primeiro", async () => {
      prisma.pedido.findMany
        .mockResolvedValueOnce([
          { valorTotal: "10", metragemTotal: "1.62", material: { tipo: "Adesivo fosco 106 cm" }, _count: { retrabalhos: 0 } },
          { valorTotal: "10", metragemTotal: "5.10", material: { tipo: "Lona fosca 120 cm" }, _count: { retrabalhos: 0 } },
          { valorTotal: "10", metragemTotal: "2.79", material: { tipo: "Adesivo fosco 106 cm" }, _count: { retrabalhos: 0 } },
        ])
        .mockResolvedValueOnce([]);

      const { pedidosPorMaterial } = await service.indicadores(periodoValido);

      expect(pedidosPorMaterial).toEqual([
        { material: "Lona fosca 120 cm", quantidade: 1, metragem: 5.1 },
        { material: "Adesivo fosco 106 cm", quantidade: 2, metragem: 4.41 },
      ]);
    });

    it("nao divide por zero sem pedidos concluidos", async () => {
      const resultado = await service.indicadores(periodoValido);

      expect(resultado.taxaRetrabalho).toBeNull();
      expect(resultado.tempoMedioHoras).toBeNull();
    });

    it("traz o resumo mes a mes junto dos indicadores", async () => {
      const { porMes } = await service.indicadores(periodoValido);

      expect(porMes.meses).toEqual([{ mes: "2026-11", pedidos: 0, metragem: 0, metragemCobrada: 0, receita: 0 }]);
    });
  });

  describe("resumoPorMes (relatorio mensal, RF25)", () => {
    const ano = { inicio: new Date("2026-01-01T03:00:00Z"), fim: new Date("2026-03-31T02:59:59.999Z") };
    const pedido = (concluidoEm: string, valorTotal: string, largura: string, altura: string, quantidade = 1) => ({
      concluidoEm: new Date(concluidoEm),
      valorTotal,
      metragemTotal: String(Number(largura) * Number(altura) * quantidade),
      largura,
      altura,
      quantidade,
    });

    it("lista todos os meses do periodo, mesmo sem pedido, e soma o total", () => {
      const { meses, total } = resumoPorMes(
        [pedido("2026-01-10T15:00:00Z", "29", "1.04", "0.935"), pedido("2026-03-05T15:00:00Z", "116", "1.1", "0.8", 4)],
        ano,
      );

      expect(meses).toEqual([
        { mes: "2026-01", pedidos: 1, metragem: 0.97, metragemCobrada: 1, receita: 29 },
        { mes: "2026-02", pedidos: 0, metragem: 0, metragemCobrada: 0, receita: 0 },
        { mes: "2026-03", pedidos: 1, metragem: 3.52, metragemCobrada: 4, receita: 116 },
      ]);
      expect(total).toEqual({ pedidos: 2, metragem: 4.49, metragemCobrada: 5, receita: 145 });
    });

    it("usa o horario de Brasilia para decidir o mes", () => {
      // 01/02 as 01h UTC ainda e 31/01 as 22h em Brasilia
      const { meses } = resumoPorMes([pedido("2026-02-01T01:00:00Z", "50", "2", "1")], ano);

      expect(meses[0]).toMatchObject({ mes: "2026-01", pedidos: 1, receita: 50 });
      expect(meses[1].pedidos).toBe(0);
    });

    it("atravessa a virada do ano", () => {
      const periodo = { inicio: new Date("2025-11-01T03:00:00Z"), fim: new Date("2026-02-28T03:00:00Z") };

      expect(resumoPorMes([], periodo).meses.map((m) => m.mes)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    });
  });
});
