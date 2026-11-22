import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaTenantClient } from "../lib/prisma-tenant";
import {
  servicoAdicionalService,
  ServicoAdicionalNaoEncontradoError,
  ServicoAdicionalInvalidoError,
} from "./servico-adicional.service";

const prismaFalso = {
  servicoAdicional: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const service = servicoAdicionalService(prismaFalso as unknown as PrismaTenantClient);

describe("servicoAdicionalService (RF04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaFalso.servicoAdicional.findUnique.mockResolvedValue({ id: "srv-1", descricao: "Ilhos", valorPadrao: 5 });
  });

  it("cria servico com descricao e valor padrao", async () => {
    await service.criar({ descricao: " Ilhos ", valorPadrao: "5" });

    expect(prismaFalso.servicoAdicional.create.mock.calls[0][0].data).toMatchObject({
      descricao: "Ilhos",
      valorPadrao: 5,
    });
  });

  it("recusa descricao vazia e valor invalido", async () => {
    await expect(service.criar({ descricao: "", valorPadrao: 5 })).rejects.toThrow("descricao e obrigatoria");
    for (const valorPadrao of [0, -3, "x"]) {
      await expect(service.criar({ descricao: "Solda", valorPadrao })).rejects.toThrow(ServicoAdicionalInvalidoError);
    }
    expect(prismaFalso.servicoAdicional.create).not.toHaveBeenCalled();
  });

  it("lista e busca por id", async () => {
    await service.listar();
    expect(prismaFalso.servicoAdicional.findMany).toHaveBeenCalled();

    await expect(service.buscarPorId("srv-1")).resolves.toMatchObject({ descricao: "Ilhos" });
    prismaFalso.servicoAdicional.findUnique.mockResolvedValue(null);
    await expect(service.buscarPorId("outro")).rejects.toThrow(ServicoAdicionalNaoEncontradoError);
  });

  it("atualiza descricao e valor, validando", async () => {
    await service.atualizar("srv-1", { descricao: " Instalacao ", valorPadrao: "80" });

    expect(prismaFalso.servicoAdicional.update.mock.calls[0][0].data).toEqual({
      descricao: "Instalacao",
      valorPadrao: 80,
    });
    await expect(service.atualizar("srv-1", { descricao: "" })).rejects.toThrow(ServicoAdicionalInvalidoError);
    await expect(service.atualizar("srv-1", { valorPadrao: -1 })).rejects.toThrow(ServicoAdicionalInvalidoError);
  });

  it("remove so servico existente", async () => {
    await service.remover("srv-1");
    expect(prismaFalso.servicoAdicional.delete).toHaveBeenCalledWith({ where: { id: "srv-1" } });

    prismaFalso.servicoAdicional.findUnique.mockResolvedValue(null);
    await expect(service.remover("outro")).rejects.toThrow(ServicoAdicionalNaoEncontradoError);
  });
});
