import type { Request, Response, NextFunction } from "express";
import type { Perfil } from "../generated/prisma/enums";

export function autorizar(...perfisPermitidos: Perfil[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: "acesso negado para este perfil" });
    }

    next();
  };
}
