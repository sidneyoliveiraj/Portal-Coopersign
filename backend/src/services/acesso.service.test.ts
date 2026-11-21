import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaFalso, emailFalso } = vi.hoisted(() => ({
  prismaFalso: {
    tokenAcesso: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    usuario: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
  emailFalso: { enviarEmail: vi.fn() },
}));

vi.mock("../lib/prisma", () => ({ prisma: prismaFalso }));
vi.mock("../lib/email", () => emailFalso);

import { AcessoInvalidoError, consultarLink, definirSenha, hashToken, pedirRecuperacao } from "./acesso.service";
import { compararSenha } from "./auth.service";

const amanha = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const usuario = { id: "usu-1", nome: "Padaria", email: "p@x.dev", organizacaoId: "org-1" };

function linkValido(extra: Record<string, unknown> = {}) {
  return { usuarioId: "usu-1", tipo: "CONVITE", usadoEm: null, expiraEm: amanha(), usuario, ...extra };
}

describe("acesso.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("consultarLink", () => {
    it("procura pelo hash, nunca pelo token puro", async () => {
      prismaFalso.tokenAcesso.findUnique.mockResolvedValue(linkValido());

      const resultado = await consultarLink("abc");

      expect(resultado).toEqual({ nome: "Padaria", email: "p@x.dev", tipo: "CONVITE" });
      expect(prismaFalso.tokenAcesso.findUnique.mock.calls[0][0].where).toEqual({ tokenHash: hashToken("abc") });
    });

    it.each([
      ["inexistente", null],
      ["ja usado", linkValido({ usadoEm: new Date() })],
      ["expirado", linkValido({ expiraEm: new Date(Date.now() - 1000) })],
    ])("recusa link %s", async (_caso, registro) => {
      prismaFalso.tokenAcesso.findUnique.mockResolvedValue(registro);

      await expect(consultarLink("abc")).rejects.toThrow("link invalido ou expirado");
    });

    it.each([undefined, "", { contains: "a" }])("recusa token que nao e texto (%s)", async (token) => {
      await expect(consultarLink(token)).rejects.toThrow(AcessoInvalidoError);
      expect(prismaFalso.tokenAcesso.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("definirSenha", () => {
    it("grava o hash da nova senha e invalida os links abertos do usuario", async () => {
      prismaFalso.tokenAcesso.findUnique.mockResolvedValue(linkValido());

      await definirSenha({ token: "abc", senha: "novaSenha" });

      const { senhaHash } = prismaFalso.usuario.update.mock.calls[0][0].data;
      expect(await compararSenha("novaSenha", senhaHash)).toBe(true);
      expect(prismaFalso.tokenAcesso.updateMany.mock.calls[0][0]).toEqual({
        where: { usuarioId: "usu-1", usadoEm: null },
        data: { usadoEm: expect.any(Date) },
      });
      expect(prismaFalso.$transaction).toHaveBeenCalledOnce();
    });

    it("exige senha com pelo menos 6 caracteres", async () => {
      prismaFalso.tokenAcesso.findUnique.mockResolvedValue(linkValido());

      await expect(definirSenha({ token: "abc", senha: "123" })).rejects.toThrow("pelo menos 6 caracteres");
      expect(prismaFalso.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("pedirRecuperacao", () => {
    it("cria um link por conta ativa com o e-mail e envia", async () => {
      prismaFalso.usuario.findMany.mockResolvedValue([usuario]);

      await pedirRecuperacao({ email: " p@x.dev " }, "http://app");

      expect(prismaFalso.usuario.findMany.mock.calls[0][0].where).toEqual({ email: "p@x.dev", ativo: true });
      expect(prismaFalso.tokenAcesso.create.mock.calls[0][0].data).toMatchObject({
        organizacaoId: "org-1",
        usuarioId: "usu-1",
        tipo: "RECUPERACAO",
      });
      expect(emailFalso.enviarEmail.mock.calls[0][0].texto).toContain("http://app/definir-senha?token=");
    });

    it("e-mail sem conta nao gera erro nem envia nada", async () => {
      prismaFalso.usuario.findMany.mockResolvedValue([]);

      await expect(pedirRecuperacao({ email: "ninguem@x.dev" }, "http://app")).resolves.toBeUndefined();
      expect(emailFalso.enviarEmail).not.toHaveBeenCalled();
    });

    it.each([undefined, "", { contains: "@" }])("exige e-mail em texto (%s)", async (email) => {
      await expect(pedirRecuperacao({ email }, "http://app")).rejects.toThrow("email e obrigatorio");
    });
  });
});
