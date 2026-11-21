import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaTenantClient } from "../lib/prisma-tenant";
import { materialService, MaterialNaoEncontradoError, MaterialInvalidoError } from "./material.service";

const prismaFalso = {
  material: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const service = materialService(prismaFalso as unknown as PrismaTenantClient);

describe("materialService (RF03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaFalso.material.findUnique.mockResolvedValue({ id: "mat-1", tipo: "Lona", precoM2: 29 });
  });

  it("cria material e converte o preco digitado como texto", async () => {
    await service.criar({ tipo: " Lona ", precoM2: "29.5" });

    expect(prismaFalso.material.create.mock.calls[0][0].data).toMatchObject({ tipo: "Lona", precoM2: 29.5 });
  });

  it("recusa tipo vazio e preco zero, negativo ou que nao e numero", async () => {
    await expect(service.criar({ tipo: "", precoM2: 29 })).rejects.toThrow("tipo e obrigatorio");
    for (const precoM2 of [0, -1, "abc"]) {
      await expect(service.criar({ tipo: "Lona", precoM2 })).rejects.toThrow(MaterialInvalidoError);
    }
    expect(prismaFalso.material.create).not.toHaveBeenCalled();
  });

  it("lista e busca por id", async () => {
    await service.listar();
    expect(prismaFalso.material.findMany).toHaveBeenCalled();

    await expect(service.buscarPorId("mat-1")).resolves.toMatchObject({ tipo: "Lona" });
    prismaFalso.material.findUnique.mockResolvedValue(null);
    await expect(service.buscarPorId("outro")).rejects.toThrow(MaterialNaoEncontradoError);
  });

  it("atualiza so o preco, validando", async () => {
    await service.atualizar("mat-1", { precoM2: "32" });

    expect(prismaFalso.material.update.mock.calls[0][0].data).toEqual({ precoM2: 32 });
    await expect(service.atualizar("mat-1", { precoM2: 0 })).rejects.toThrow(MaterialInvalidoError);
  });

  it("atualiza o tipo, validando", async () => {
    await service.atualizar("mat-1", { tipo: " Vinil " });

    expect(prismaFalso.material.update.mock.calls[0][0].data).toEqual({ tipo: "Vinil" });
    await expect(service.atualizar("mat-1", { tipo: " " })).rejects.toThrow(MaterialInvalidoError);
  });

  it("remove so material existente", async () => {
    await service.remover("mat-1");
    expect(prismaFalso.material.delete).toHaveBeenCalledWith({ where: { id: "mat-1" } });

    prismaFalso.material.findUnique.mockResolvedValue(null);
    await expect(service.remover("outro")).rejects.toThrow(MaterialNaoEncontradoError);
  });
});
