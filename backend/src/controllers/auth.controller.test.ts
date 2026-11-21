import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { prismaFalso, authFalso } = vi.hoisted(() => ({
  prismaFalso: { usuario: { findMany: vi.fn() } },
  authFalso: { compararSenha: vi.fn(), gerarToken: vi.fn() },
}));

vi.mock("../lib/prisma", () => ({ prisma: prismaFalso }));
vi.mock("../services/auth.service", () => authFalso);

import { loginController } from "./auth.controller";

function respostaFalsa() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

async function login(body: unknown) {
  const res = respostaFalsa();
  await loginController({ body } as Request, res as unknown as Response);
  return res;
}

const usuario = {
  id: "usr-1",
  organizacaoId: "org-1",
  perfil: "GESTOR",
  ativo: true,
  senhaHash: "hash",
};

describe("loginController (RF32)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authFalso.gerarToken.mockReturnValue("token-falso");
  });

  it.each([
    ["email como objeto de filtro", { email: { contains: "@" }, senha: "senha123" }],
    ["senha como objeto", { email: "a@x.dev", senha: { not: "" } }],
    ["organizacaoId como objeto", { email: "a@x.dev", senha: "senha123", organizacaoId: { not: "" } }],
    ["email vazio", { email: "", senha: "senha123" }],
    ["sem senha", { email: "a@x.dev" }],
    ["sem corpo", undefined],
  ])("recusa %s com 400 sem consultar o banco", async (_caso, body) => {
    const res = await login(body ?? {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaFalso.usuario.findMany).not.toHaveBeenCalled();
  });

  it("devolve o token com credenciais corretas", async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([usuario]);
    authFalso.compararSenha.mockResolvedValue(true);

    const res = await login({ email: "a@x.dev", senha: "senha123" });

    expect(prismaFalso.usuario.findMany).toHaveBeenCalledWith({ where: { email: "a@x.dev" } });
    expect(authFalso.gerarToken).toHaveBeenCalledWith({
      usuarioId: "usr-1",
      organizacaoId: "org-1",
      perfil: "GESTOR",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: "token-falso" });
  });

  it("filtra pela organizacao quando ela e informada", async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([usuario]);
    authFalso.compararSenha.mockResolvedValue(true);

    await login({ email: "a@x.dev", senha: "senha123", organizacaoId: "org-1" });

    expect(prismaFalso.usuario.findMany).toHaveBeenCalledWith({
      where: { email: "a@x.dev", organizacaoId: "org-1" },
    });
  });

  it("recusa senha errada com 401", async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([usuario]);
    authFalso.compararSenha.mockResolvedValue(false);

    const res = await login({ email: "a@x.dev", senha: "errada" });

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("avisa que o cadastro do cliente aguarda aprovacao (RN14)", async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([{ ...usuario, perfil: "CLIENTE", ativo: false }]);
    authFalso.compararSenha.mockResolvedValue(true);

    const res = await login({ email: "a@x.dev", senha: "senha123" });

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ erro: "cadastro inativo ou aguardando aprovacao do gestor" });
  });

  it("recusa usuario interno inativo com 403", async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([{ ...usuario, ativo: false }]);
    authFalso.compararSenha.mockResolvedValue(true);

    const res = await login({ email: "a@x.dev", senha: "senha123" });

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ erro: "usuario inativo" });
  });

  it("pede a organizacao quando o email existe em mais de uma", async () => {
    prismaFalso.usuario.findMany.mockResolvedValue([usuario, { ...usuario, id: "usr-2", organizacaoId: "org-2" }]);
    authFalso.compararSenha.mockResolvedValue(true);

    const res = await login({ email: "a@x.dev", senha: "senha123" });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(authFalso.gerarToken).not.toHaveBeenCalled();
  });
});
