import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Perfil } from "../generated/prisma/enums";

const SALT_ROUNDS = 10;

export interface PayloadToken {
  usuarioId: string;
  organizacaoId: string;
  perfil: Perfil;
}

const PERFIS: string[] = Object.values(Perfil);

// O jwt.verify garante a assinatura, nao o formato: confere os campos antes de usar.
function ehPayloadToken(dado: unknown): dado is PayloadToken {
  if (typeof dado !== "object" || dado === null) {
    return false;
  }

  const { usuarioId, organizacaoId, perfil } = dado as Record<string, unknown>;
  return (
    typeof usuarioId === "string" &&
    typeof organizacaoId === "string" &&
    typeof perfil === "string" &&
    PERFIS.includes(perfil)
  );
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

  const dado = jwt.verify(token, segredo);
  if (!ehPayloadToken(dado)) {
    throw new Error("token com formato invalido");
  }

  return dado;
}
