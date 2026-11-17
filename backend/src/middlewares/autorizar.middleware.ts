import { Request, Response, NextFunction } from "express";

export function autorizar(...perfisPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: "acesso negado para este perfil" });
    }

    next();
  };
}
