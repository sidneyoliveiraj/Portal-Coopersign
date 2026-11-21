import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaTenantClient } from "../lib/prisma-tenant";
import { maquinaService, MaquinaNaoEncontradaError, MaquinaInvalidaError } from "./maquina.service";

const prismaFalso = {
  maquina: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const service = maquinaService(prismaFalso as unknown as PrismaTenantClient);

describe("maquinaService (RF02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaFalso.maquina.findUnique.mockResolvedValue({ id: "maq-1", nome: "Plotter", tipo: "impressao" });
  });

  it("cria maquina com nome e tipo sem espacos nas pontas", async () => {
    await service.criar({ nome: " Plotter ", tipo: " impressao " });

    expect(prismaFalso.maquina.create.mock.calls[0][0].data).toMatchObject({ nome: "Plotter", tipo: "impressao" });
  });

  it("exige nome e tipo", async () => {
    await expect(service.criar({ nome: "", tipo: "impressao" })).rejects.toThrow("nome e obrigatorio");
    await expect(service.criar({ nome: "Plotter", tipo: " " })).rejects.toThrow("tipo e obrigatorio");
    expect(prismaFalso.maquina.create).not.toHaveBeenCalled();
  });

  it("lista as maquinas", async () => {
    prismaFalso.maquina.findMany.mockResolvedValue([{ id: "maq-1" }]);

    await expect(service.listar()).resolves.toHaveLength(1);
  });

  it("busca por id e avisa quando nao existe", async () => {
    await expect(service.buscarPorId("maq-1")).resolves.toMatchObject({ nome: "Plotter" });

    prismaFalso.maquina.findUnique.mockResolvedValue(null);
    await expect(service.buscarPorId("outra")).rejects.toThrow(MaquinaNaoEncontradaError);
  });

  it("atualiza o status sem exigir nome e tipo", async () => {
    await service.atualizar("maq-1", { status: "MANUTENCAO" });

    expect(prismaFalso.maquina.update.mock.calls[0][0].data).toEqual({ status: "MANUTENCAO" });
  });

  it("valida nome e tipo quando vem na atualizacao", async () => {
    await service.atualizar("maq-1", { nome: " Recorte ", tipo: " corte " });

    expect(prismaFalso.maquina.update.mock.calls[0][0].data).toEqual({ nome: "Recorte", tipo: "corte" });
    await expect(service.atualizar("maq-1", { nome: " " })).rejects.toThrow(MaquinaInvalidaError);
    await expect(service.atualizar("maq-1", { tipo: "" })).rejects.toThrow(MaquinaInvalidaError);
  });

  it("remove so maquina existente", async () => {
    await service.remover("maq-1");
    expect(prismaFalso.maquina.delete).toHaveBeenCalledWith({ where: { id: "maq-1" } });

    prismaFalso.maquina.findUnique.mockResolvedValue(null);
    await expect(service.remover("outra")).rejects.toThrow(MaquinaNaoEncontradaError);
    await expect(service.atualizar("outra", { nome: "X" })).rejects.toThrow(MaquinaNaoEncontradaError);
  });
});
