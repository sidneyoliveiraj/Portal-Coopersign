import { describe, it, expect, vi, beforeEach } from "vitest";
import { portalService, PedidoDoClienteNaoEncontradoError } from "./portal.service";
import { PrismaTenantClient } from "../lib/prisma-tenant";

function criarPrismaFalso() {
  return {
    usuario: { findUnique: vi.fn().mockResolvedValue({ clienteId: "cli-1" }) },
    pedido: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
  };
}

describe("portalService (RF29-RF31, RN10)", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;
  let service: ReturnType<typeof portalService>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
    service = portalService(prisma as unknown as PrismaTenantClient, "usu-1");
  });

  it("lista apenas os pedidos do cliente vinculado ao usuario", async () => {
    await service.listarPedidos();

    expect(prisma.pedido.findMany.mock.calls[0][0].where).toEqual({ clienteId: "cli-1" });
  });

  it("nao expoe dados internos de producao", async () => {
    await service.listarPedidos();

    const { select } = prisma.pedido.findMany.mock.calls[0][0];
    expect(select.observacaoTecnica).toBeUndefined();
    expect(select.valorBase).toBeUndefined();
    expect(select.retrabalhos).toBeUndefined();
  });

  it("usuario sem cliente vinculado nao ve pedidos", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ clienteId: null });

    await expect(service.listarPedidos()).resolves.toEqual([]);
    expect(prisma.pedido.findMany).not.toHaveBeenCalled();
  });

  it("nao encontra pedido de outro cliente", async () => {
    await expect(service.buscarPedido("ped-x")).rejects.toThrow(PedidoDoClienteNaoEncontradoError);
    expect(prisma.pedido.findFirst.mock.calls[0][0].where).toEqual({ id: "ped-x", clienteId: "cli-1" });
  });
});
