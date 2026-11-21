import { EventEmitter } from "node:events";
import { describe, it, expect, vi } from "vitest";
import { Request, Response } from "express";
import { criarNotificador } from "./tempo-real";

function simular(method: string, statusCode: number, usuario?: { organizacaoId: string }) {
  const emitir = vi.fn();
  const proximo = vi.fn();
  const res = Object.assign(new EventEmitter(), { statusCode });

  criarNotificador(emitir)(
    { method, usuario } as unknown as Request,
    res as unknown as Response,
    proximo,
  );
  res.emit("finish");

  return { emitir, proximo };
}

describe("notificador de tempo real (RF22)", () => {
  it("avisa a organizacao depois de uma alteracao bem-sucedida", () => {
    const { emitir, proximo } = simular("POST", 200, { organizacaoId: "org-1" });

    expect(proximo).toHaveBeenCalledTimes(1);
    expect(emitir).toHaveBeenCalledWith("org-1");
  });

  it("nao avisa em consultas", () => {
    expect(simular("GET", 200, { organizacaoId: "org-1" }).emitir).not.toHaveBeenCalled();
  });

  it("nao avisa quando a alteracao falha", () => {
    expect(simular("POST", 400, { organizacaoId: "org-1" }).emitir).not.toHaveBeenCalled();
  });

  it("nao avisa sem usuario autenticado", () => {
    expect(simular("POST", 401).emitir).not.toHaveBeenCalled();
  });
});
