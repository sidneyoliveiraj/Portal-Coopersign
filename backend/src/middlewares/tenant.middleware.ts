import { Request, Response, NextFunction } from "express";
import { prismaTenant } from "../lib/prisma-tenant";

export function injetarTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "nao autenticado" });
  }

  req.prisma = prismaTenant(req.usuario.organizacaoId);
  next();
}
