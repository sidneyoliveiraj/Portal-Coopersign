import { NextFunction, Request, Response } from "express";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

// Metricas lidas pelo Prometheus em GET /metrics (rota interna, nao passa pelo proxy publico).
export const registro = new Registry();
collectDefaultMetrics({ register: registro });

const duracaoRequisicoes = new Histogram({
  name: "http_requisicoes_duracao_segundos",
  help: "Tempo de resposta das requisicoes HTTP",
  labelNames: ["metodo", "rota", "status"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registro],
});

const totalRequisicoes = new Counter({
  name: "http_requisicoes_total",
  help: "Total de requisicoes HTTP",
  labelNames: ["metodo", "rota", "status"],
  registers: [registro],
});

// Usa o padrao da rota (/api/pedidos/:id) e nao a URL real, senao cada id vira uma serie nova.
export function rotaDaRequisicao(req: Request) {
  if (!req.route) return "nao_encontrada";
  return `${req.baseUrl}${req.route.path}`;
}

export function medirRequisicoes(req: Request, res: Response, proximo: NextFunction) {
  const fim = duracaoRequisicoes.startTimer();
  res.on("finish", () => {
    const rotulos = { metodo: req.method, rota: rotaDaRequisicao(req), status: String(res.statusCode) };
    fim(rotulos);
    totalRequisicoes.inc(rotulos);
  });
  proximo();
}

export async function expor(_req: Request, res: Response) {
  res.set("Content-Type", registro.contentType);
  res.send(await registro.metrics());
}
