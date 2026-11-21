import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaTenantClient } from "../lib/prisma-tenant";
import { clienteService, ClienteNaoEncontradoError, ClienteInvalidoError } from "./cliente.service";

const prismaFalso = {
  cliente: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const service = clienteService(prismaFalso as unknown as PrismaTenantClient);

describe("clienteService (RF01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaFalso.cliente.findUnique.mockResolvedValue({ id: "cli-1", nome: "Charles" });
  });

  it("cria cliente so com o nome, sem espacos nas pontas", async () => {
    await service.criar({ nome: "  Charles  " });

    expect(prismaFalso.cliente.create).toHaveBeenCalledWith({ data: { nome: "Charles" } });
  });

  it("recusa cliente sem nome", async () => {
    await expect(service.criar({ nome: "   " })).rejects.toThrow(ClienteInvalidoError);
    expect(prismaFalso.cliente.create).not.toHaveBeenCalled();
  });

  it("lista em ordem alfabetica", async () => {
    await service.listar();

    expect(prismaFalso.cliente.findMany).toHaveBeenCalledWith({ orderBy: { nome: "asc" } });
  });

  it("busca por id e avisa quando nao existe", async () => {
    await expect(service.buscarPorId("cli-1")).resolves.toMatchObject({ nome: "Charles" });

    prismaFalso.cliente.findUnique.mockResolvedValue(null);
    await expect(service.buscarPorId("outro")).rejects.toThrow(ClienteNaoEncontradoError);
  });

  it("atualiza validando o nome so quando ele vem", async () => {
    await service.atualizar("cli-1", { telefone: "47999990000" });
    await service.atualizar("cli-1", { nome: " Charles Silva " });

    expect(prismaFalso.cliente.update.mock.calls[0][0].data).toEqual({ telefone: "47999990000" });
    expect(prismaFalso.cliente.update.mock.calls[1][0].data).toEqual({ nome: "Charles Silva" });
    await expect(service.atualizar("cli-1", { nome: "" })).rejects.toThrow(ClienteInvalidoError);
  });

  it("nao atualiza nem remove cliente inexistente", async () => {
    prismaFalso.cliente.findUnique.mockResolvedValue(null);

    await expect(service.atualizar("outro", { nome: "X" })).rejects.toThrow(ClienteNaoEncontradoError);
    await expect(service.remover("outro")).rejects.toThrow(ClienteNaoEncontradoError);
    expect(prismaFalso.cliente.update).not.toHaveBeenCalled();
    expect(prismaFalso.cliente.delete).not.toHaveBeenCalled();
  });

  it("remove cliente existente", async () => {
    await service.remover("cli-1");

    expect(prismaFalso.cliente.delete).toHaveBeenCalledWith({ where: { id: "cli-1" } });
  });
});
