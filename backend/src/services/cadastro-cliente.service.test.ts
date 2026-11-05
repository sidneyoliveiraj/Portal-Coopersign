import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { prismaFalso, tx } = vi.hoisted(() => {
  const tx = {
    cliente: { create: vi.fn() },
    usuario: { create: vi.fn() },
  };
  const prismaFalso = {
    organizacao: { findUnique: vi.fn() },
    usuario: { findFirst: vi.fn() },
    $transaction: vi.fn((executar: (cliente: typeof tx) => Promise<unknown>) => executar(tx)),
  };
  return { prismaFalso, tx };
});

vi.mock("../lib/prisma", () => ({ prisma: prismaFalso }));

import { cadastrarCliente, CadastroInvalidoError } from "./cadastro-cliente.service";

const dados = { nome: "Oficina Nova", email: "oficina@x.dev", senha: "senha123" };

describe("cadastrarCliente (RF36, RF37, RN14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ORGANIZACAO_CADASTRO_ID", "org-1");
    prismaFalso.organizacao.findUnique.mockResolvedValue({ id: "org-1" });
    prismaFalso.usuario.findFirst.mockResolvedValue(null);
    tx.cliente.create.mockResolvedValue({ id: "cli-1" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cria cliente e usuario inativo ate a aprovacao do gestor", async () => {
    await cadastrarCliente(dados);

    expect(tx.usuario.create.mock.calls[0][0].data).toMatchObject({
      organizacaoId: "org-1",
      perfil: "CLIENTE",
      ativo: false,
      clienteId: "cli-1",
    });
    expect(tx.usuario.create.mock.calls[0][0].data.senhaHash).not.toBe(dados.senha);
  });

  it("ignora perfil e organizacao enviados no formulario", async () => {
    await cadastrarCliente({ ...dados, perfil: "ADMINISTRADOR", ativo: true, organizacaoId: "org-2" });

    expect(tx.usuario.create.mock.calls[0][0].data).toMatchObject({
      organizacaoId: "org-1",
      perfil: "CLIENTE",
      ativo: false,
    });
  });

  it("rejeita email ja cadastrado", async () => {
    prismaFalso.usuario.findFirst.mockResolvedValue({ id: "usu-1" });

    await expect(cadastrarCliente(dados)).rejects.toThrow("ja existe uma conta com este email");
    expect(prismaFalso.$transaction).not.toHaveBeenCalled();
  });

  it("rejeita senha curta", async () => {
    await expect(cadastrarCliente({ ...dados, senha: "123" })).rejects.toThrow(CadastroInvalidoError);
  });

  it("fica indisponivel sem organizacao configurada", async () => {
    vi.stubEnv("ORGANIZACAO_CADASTRO_ID", "");

    await expect(cadastrarCliente(dados)).rejects.toThrow("cadastro publico indisponivel");
  });
});
