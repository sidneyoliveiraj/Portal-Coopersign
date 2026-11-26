import { describe, it, expect, afterEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import { hashSenha, compararSenha, gerarToken, verificarToken, type PayloadToken } from "./auth.service";

const payload: PayloadToken = { usuarioId: "usu-1", organizacaoId: "org-1", perfil: "GESTOR" };

describe("auth.service (RF32, RF33)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("guarda a senha com hash e confere so a senha certa", async () => {
    const hash = await hashSenha("senha123");

    expect(hash).not.toBe("senha123");
    await expect(compararSenha("senha123", hash)).resolves.toBe(true);
    await expect(compararSenha("errada", hash)).resolves.toBe(false);
  });

  it("gera token com usuario, organizacao e perfil, valido por 8 horas", () => {
    vi.stubEnv("JWT_SECRET", "segredo-teste");

    const lido = verificarToken(gerarToken(payload)) as typeof payload & { iat: number; exp: number };

    expect(lido).toMatchObject(payload);
    expect(lido.exp - lido.iat).toBe(8 * 60 * 60);
  });

  it("recusa token assinado com outro segredo", () => {
    vi.stubEnv("JWT_SECRET", "segredo-teste");
    const falso = jwt.sign(payload, "outro-segredo");

    expect(() => verificarToken(falso)).toThrow();
  });

  it("recusa token bem assinado mas com formato errado", () => {
    vi.stubEnv("JWT_SECRET", "segredo-teste");
    const semPerfil = jwt.sign({ usuarioId: "usu-1", organizacaoId: "org-1" }, "segredo-teste");
    const perfilInventado = jwt.sign({ ...payload, perfil: "SUPERADMIN" }, "segredo-teste");
    const organizacaoNumero = jwt.sign({ ...payload, organizacaoId: 1 }, "segredo-teste");
    const textoSimples = jwt.sign("so-um-texto", "segredo-teste");

    for (const token of [semPerfil, perfilInventado, organizacaoNumero, textoSimples]) {
      expect(() => verificarToken(token)).toThrow("token com formato invalido");
    }
  });

  it("nao gera nem confere token sem JWT_SECRET", () => {
    vi.stubEnv("JWT_SECRET", "");

    expect(() => gerarToken(payload)).toThrow("JWT_SECRET nao configurado");
    expect(() => verificarToken("qualquer")).toThrow("JWT_SECRET nao configurado");
  });
});
