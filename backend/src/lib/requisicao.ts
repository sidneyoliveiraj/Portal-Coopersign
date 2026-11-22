import type { Request } from "express";

// Rotas protegidas passam por autenticar e injetarTenant antes do controller.
// Se alguma rota for registrada sem eles, o erro aparece aqui em vez de virar acesso sem organizacao.
export function prismaDaRequisicao(req: Request) {
  if (!req.prisma) throw new Error("rota sem o middleware injetarTenant");
  return req.prisma;
}

export function usuarioDaRequisicao(req: Request) {
  if (!req.usuario) throw new Error("rota sem o middleware autenticar");
  return req.usuario;
}
