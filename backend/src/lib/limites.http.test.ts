import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("limites de tentativas e cabecalhos de seguranca", () => {
  beforeAll(() => {
    process.env.LIMITES_DESLIGADOS = "0";
  });
  afterAll(() => {
    process.env.LIMITES_DESLIGADOS = "1";
  });

  it("bloqueia o login depois de 10 tentativas erradas do mesmo IP", async () => {
    for (let tentativa = 1; tentativa <= 10; tentativa++) {
      const resposta = await request(app).post("/api/auth/login").send({});
      expect(resposta.status).toBe(400);
    }

    const bloqueada = await request(app).post("/api/auth/login").send({});

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.erro).toContain("muitas tentativas");
  });

  it("o IP vem do X-Forwarded-For quando quem repassa e proxy da rede interna", async () => {
    const deOutroIp = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", "203.0.113.7")
      .send({});

    expect(deOutroIp.status).toBe(400);
  });

  it("responde com os cabecalhos do helmet e sem X-Powered-By", async () => {
    const resposta = await request(app).get("/api/health");

    expect(resposta.headers["x-content-type-options"]).toBe("nosniff");
    expect(resposta.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(resposta.headers["x-powered-by"]).toBeUndefined();
  });
});
