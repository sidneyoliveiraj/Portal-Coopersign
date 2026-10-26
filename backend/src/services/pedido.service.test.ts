import { describe, it, expect, vi, beforeEach } from "vitest";
import { pedidoService, PedidoInvalidoError, PedidoNaoEncontradoError } from "./pedido.service";
import { PrismaTenantClient } from "../lib/prisma-tenant";

function criarPrismaFalso() {
  return {
    cliente: { findUnique: vi.fn().mockResolvedValue({ id: "cli-1" }) },
    material: { findUnique: vi.fn().mockResolvedValue({ id: "mat-1", precoM2: "45.50" }) },
    servicoAdicional: {
      findUnique: vi.fn().mockResolvedValue({ id: "srv-1", valorPadrao: "12.00" }),
    },
    pedido: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "ped-1", ...data })),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    ajusteValor: { create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  };
}

const pedidoValido = {
  clienteId: "cli-1",
  materialId: "mat-1",
  largura: 1.5,
  altura: 2.2,
  quantidade: 3,
  acabamento: "ilhos nos cantos",
  arquivoUrl: "https://drive.google.com/arte.pdf",
  prazoEntrega: "2026-11-10",
};

describe("pedidoService.criar", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
  });

  it("calcula metragem, valor base e valor total a partir do material", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);
    const pedido = await service.criar(pedidoValido);

    expect(pedido.metragemTotal).toBe(9.9);
    expect(pedido.valorBase).toBe(450.45);
    expect(pedido.valorTotal).toBe(450.45);
    expect(pedido.status).toBe("AGUARDANDO_VALIDACAO");
    expect(pedido.formaPagamento).toBe("A_VISTA");
  });

  it("soma servicos adicionais pelo valor padrao vezes a quantidade", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);
    const pedido = await service.criar({
      ...pedidoValido,
      servicos: [{ servicoAdicionalId: "srv-1", quantidade: 4 }],
    });

    expect(pedido.valorTotal).toBe(498.45);
    expect(pedido.pedidoServicos).toEqual({
      create: [{ servicoAdicionalId: "srv-1", quantidade: 4, valorUnitario: 12 }],
    });
  });

  it("rejeita pedido sem campo obrigatorio", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);
    const { acabamento, ...semAcabamento } = pedidoValido;

    await expect(service.criar(semAcabamento)).rejects.toThrow(PedidoInvalidoError);
    expect(prisma.pedido.create).not.toHaveBeenCalled();
  });

  it("rejeita dimensao invalida antes de consultar o banco", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(service.criar({ ...pedidoValido, largura: -1 })).rejects.toThrow(PedidoInvalidoError);
    expect(prisma.material.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita material que nao existe na organizacao", async () => {
    prisma.material.findUnique.mockResolvedValue(null);
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(service.criar(pedidoValido)).rejects.toThrow("material nao encontrado");
  });

  it("rejeita forma de pagamento desconhecida", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(service.criar({ ...pedidoValido, formaPagamento: "PIX" })).rejects.toThrow(
      PedidoInvalidoError,
    );
  });
});

describe("pedidoService.ajustarValor", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
    prisma.pedido.findUnique.mockResolvedValue({
      id: "ped-1",
      status: "AGUARDANDO_VALIDACAO",
      valorTotal: "450.45",
    });
  });

  it("exige justificativa (RN13)", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(service.ajustarValor("ped-1", { valor: -50 })).rejects.toThrow(
      "justificativa e obrigatorio",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("registra o ajuste e recalcula o valor total na mesma transacao", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);
    await service.ajustarValor("ped-1", { valor: -50.45, justificativa: "desconto cliente antigo" });

    expect(prisma.ajusteValor.create).toHaveBeenCalledWith({
      data: { pedidoId: "ped-1", descricao: "desconto cliente antigo", valor: -50.45 },
    });
    expect(prisma.pedido.update).toHaveBeenCalledWith({
      where: { id: "ped-1" },
      data: { valorTotal: 400 },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("nao deixa o valor total ficar negativo", async () => {
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(
      service.ajustarValor("ped-1", { valor: -500, justificativa: "erro de digitacao" }),
    ).rejects.toThrow("ajuste deixaria o valor total negativo");
  });

  it("bloqueia ajuste em pedido faturado", async () => {
    prisma.pedido.findUnique.mockResolvedValue({ id: "ped-1", status: "FATURADO", valorTotal: "450.45" });
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(
      service.ajustarValor("ped-1", { valor: 10, justificativa: "frete" }),
    ).rejects.toThrow(PedidoInvalidoError);
  });

  it("retorna nao encontrado para pedido de outra organizacao", async () => {
    prisma.pedido.findUnique.mockResolvedValue(null);
    const service = pedidoService(prisma as unknown as PrismaTenantClient);

    await expect(
      service.ajustarValor("ped-x", { valor: 10, justificativa: "frete" }),
    ).rejects.toThrow(PedidoNaoEncontradoError);
  });
});
