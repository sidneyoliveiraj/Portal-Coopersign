import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { prismaDaRequisicao, usuarioDaRequisicao } from "./requisicao";

describe("dados que os middlewares colocam na requisicao", () => {
  it("rota sem os middlewares falha em vez de seguir sem organizacao", () => {
    const req = {} as Request;
    expect(() => prismaDaRequisicao(req)).toThrow("injetarTenant");
    expect(() => usuarioDaRequisicao(req)).toThrow("autenticar");
  });
});
