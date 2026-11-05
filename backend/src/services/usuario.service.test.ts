import { describe, it, expect, vi, beforeEach } from "vitest";
import { usuarioService, UsuarioInvalidoError, UsuarioSemPermissaoError } from "./usuario.service";
import { PrismaTenantClient } from "../lib/prisma-tenant";

const admin = { usuarioId: "adm-1", perfil: "ADMINISTRADOR" };
const gestor = { usuarioId: "ges-1", perfil: "GESTOR" };
const novoUsuario = { nome: "Ana", email: "ana@coopersign.dev", senha: "senha123", perfil: "OPERADOR" };

function criarPrismaFalso() {
  return {
    usuario: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ id: "usu-1", perfil: "OPERADOR", ativo: true }),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "usu-1" }),
      update: vi.fn().mockResolvedValue({ id: "usu-1" }),
    },
  };
}

describe("usuarioService", () => {
  let prisma: ReturnType<typeof criarPrismaFalso>;
  let service: ReturnType<typeof usuarioService>;

  beforeEach(() => {
    prisma = criarPrismaFalso();
    service = usuarioService(prisma as unknown as PrismaTenantClient);
  });

  it("cria usuario guardando apenas o hash da senha (RF34)", async () => {
    await service.criar(novoUsuario, gestor);

    const dados = prisma.usuario.create.mock.calls[0][0].data;
    expect(dados.senha).toBeUndefined();
    expect(dados.senhaHash).toBeTypeOf("string");
    expect(dados.senhaHash).not.toBe(novoUsuario.senha);
  });

  it("rejeita email repetido na organizacao", async () => {
    prisma.usuario.findFirst.mockResolvedValue({ id: "usu-2" });

    await expect(service.criar(novoUsuario, gestor)).rejects.toThrow("ja existe um usuario com este email");
  });

  it("rejeita senha curta", async () => {
    await expect(service.criar({ ...novoUsuario, senha: "123" }, gestor)).rejects.toThrow(UsuarioInvalidoError);
  });

  it("nao deixa gestor criar administrador", async () => {
    await expect(service.criar({ ...novoUsuario, perfil: "ADMINISTRADOR" }, gestor)).rejects.toThrow(
      UsuarioSemPermissaoError,
    );
  });

  it("deixa administrador criar administrador", async () => {
    await service.criar({ ...novoUsuario, perfil: "ADMINISTRADOR" }, admin);

    expect(prisma.usuario.create).toHaveBeenCalledTimes(1);
  });

  it("nao deixa gestor alterar administrador", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: "adm-2", perfil: "ADMINISTRADOR", ativo: true });

    await expect(service.atualizar("adm-2", { ativo: false }, gestor)).rejects.toThrow(UsuarioSemPermissaoError);
  });

  it("nao deixa o usuario desativar a si mesmo", async () => {
    await expect(service.atualizar("ges-1", { ativo: false }, gestor)).rejects.toThrow(
      "voce nao pode desativar o proprio usuario",
    );
  });

  it("atualiza apenas nome, perfil e ativo", async () => {
    await service.atualizar("usu-1", { nome: "Ana Maria", ativo: false, email: "outro@x.dev" }, gestor);

    expect(prisma.usuario.update.mock.calls[0][0].data).toEqual({ nome: "Ana Maria", ativo: false });
  });
});
