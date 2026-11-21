import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("metricas", () => {
  it("GET /metrics expoe as metricas no formato do Prometheus", async () => {
    await request(app).get("/api/health");

    const resposta = await request(app).get("/metrics");

    expect(resposta.status).toBe(200);
    expect(resposta.headers["content-type"]).toContain("text/plain");
    expect(resposta.text).toContain("process_cpu_user_seconds_total");
    expect(resposta.text).toMatch(/http_requisicoes_total\{metodo="GET",rota="\/api\/health\/",status="200"\} \d+/);
  });

  it("usa o padrao da rota, nao o id da URL", async () => {
    await request(app).get("/api/pedidos/abc-123");

    const resposta = await request(app).get("/metrics");

    expect(resposta.text).not.toContain("abc-123");
  });

  it("rota que nao existe vira nao_encontrada", async () => {
    await request(app).get("/qualquer/coisa");

    const resposta = await request(app).get("/metrics");

    expect(resposta.text).toMatch(/rota="nao_encontrada",status="404"/);
  });
});
