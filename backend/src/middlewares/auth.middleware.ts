import { Request, Response, NextFunction } from "express";
import { verificarToken, PayloadToken } from "../services/auth.service";

declare global {
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "token nao informado" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    return res.status(401).json({ erro: "token invalido ou expirado" });
  }
}
