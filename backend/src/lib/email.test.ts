import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { nodemailerFalso, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { sendMail, nodemailerFalso: { createTransport: vi.fn(() => ({ sendMail })) } };
});

vi.mock("nodemailer", () => ({ default: nodemailerFalso }));

import { criarTransporte, enviarEmail } from "./email";

const email = { para: "cliente@x.dev", assunto: "Teste", texto: "link" };

describe("email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sem SMTP_HOST escreve no terminal e nao cria transporte", async () => {
    vi.stubEnv("SMTP_HOST", "");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await enviarEmail(email);

    expect(criarTransporte()).toBeNull();
    expect(log.mock.calls[0][0]).toContain("cliente@x.dev");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("com SMTP configurado envia pelo transporte", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.exemplo.com");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_USUARIO", "portal@exemplo.com");
    vi.stubEnv("SMTP_SENHA", "segredo");

    await enviarEmail(email);

    expect(nodemailerFalso.createTransport).toHaveBeenCalledWith({
      host: "smtp.exemplo.com",
      port: 587,
      secure: false,
      auth: { user: "portal@exemplo.com", pass: "segredo" },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: "portal@exemplo.com",
      to: "cliente@x.dev",
      subject: "Teste",
      text: "link",
    });
  });

  it("porta 465 usa conexao segura", () => {
    vi.stubEnv("SMTP_HOST", "smtp.exemplo.com");
    vi.stubEnv("SMTP_PORT", "465");

    criarTransporte();

    expect(nodemailerFalso.createTransport.mock.calls[0][0]).toMatchObject({ port: 465, secure: true });
  });
});
