import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

export interface PayloadToken {
  usuarioId: string;
  organizacaoId: string;
  perfil: string;
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function compararSenha(senha: string, senhaHash: string): Promise<boolean> {
  return bcrypt.compare(senha, senhaHash);
}

export function gerarToken(payload: PayloadToken): string {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error("JWT_SECRET nao configurado no .env");
  }

  return jwt.sign(payload, segredo, { expiresIn: "8h" });
}

export function verificarToken(token: string): PayloadToken {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error("JWT_SECRET nao configurado no .env");
  }

  return jwt.verify(token, segredo) as PayloadToken;
}
