import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { PrismaTenantClient } from "../lib/prisma-tenant";
import { enviarEmail } from "../lib/email";
import { hashSenha } from "./auth.service";

export class AcessoInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "AcessoInvalidoError";
  }
}

export type TipoLink = "CONVITE" | "RECUPERACAO";

const HORA = 60 * 60 * 1000;
export const VALIDADE: Record<TipoLink, number> = {
  CONVITE: 7 * 24 * HORA,
  RECUPERACAO: 24 * HORA,
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function senhaValida(valor: unknown): string {
  if (typeof valor !== "string" || valor.length < 6) {
    throw new AcessoInvalidoError("senha deve ter pelo menos 6 caracteres");
  }
  return valor;
}

/** Cria o link de uso unico. O token so existe na resposta; o banco guarda o hash. */
export async function gerarLink(prismaTenant: PrismaTenantClient, usuarioId: string, tipo: TipoLink) {
  const token = randomBytes(32).toString("base64url");
  await prismaTenant.tokenAcesso.create({
    data: {
      usuarioId,
      tipo,
      tokenHash: hashToken(token),
      expiraEm: new Date(Date.now() + VALIDADE[tipo]),
    } as Prisma.TokenAcessoUncheckedCreateInput,
  });
  return token;
}

async function buscarValido(token: unknown) {
  if (typeof token !== "string" || token.length === 0) {
    throw new AcessoInvalidoError("link invalido");
  }
  const registro = await prisma.tokenAcesso.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: true },
  });
  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
    throw new AcessoInvalidoError("link invalido ou expirado, peca um novo ao gestor");
  }
  return registro;
}

/** Mostra para quem e o link antes de pedir a senha. */
export async function consultarLink(token: unknown) {
  const registro = await buscarValido(token);
  return { nome: registro.usuario.nome, email: registro.usuario.email, tipo: registro.tipo };
}

export async function definirSenha(dados: Record<string, unknown>) {
  const registro = await buscarValido(dados.token);
  const senhaHash = await hashSenha(senhaValida(dados.senha));
  const agora = new Date();
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: registro.usuarioId }, data: { senhaHash } }),
    // Usar um link invalida os outros abertos do mesmo usuario.
    prisma.tokenAcesso.updateMany({
      where: { usuarioId: registro.usuarioId, usadoEm: null },
      data: { usadoEm: agora },
    }),
  ]);
}

/**
 * "Esqueci minha senha": responde sempre igual, exista o e-mail ou nao,
 * para a tela nao revelar quem tem conta.
 */
export async function pedirRecuperacao(dados: Record<string, unknown>, enderecoApp: string) {
  if (typeof dados.email !== "string" || dados.email.trim().length === 0) {
    throw new AcessoInvalidoError("email e obrigatorio");
  }
  const usuarios = await prisma.usuario.findMany({ where: { email: dados.email.trim(), ativo: true } });
  for (const usuario of usuarios) {
    const token = randomBytes(32).toString("base64url");
    await prisma.tokenAcesso.create({
      data: {
        organizacaoId: usuario.organizacaoId,
        usuarioId: usuario.id,
        tipo: "RECUPERACAO",
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + VALIDADE.RECUPERACAO),
      },
    });
    await enviarEmail({
      para: usuario.email,
      assunto: "Portal Coopersign - nova senha",
      texto: `Ola, ${usuario.nome}. Para criar uma nova senha, acesse: ${enderecoApp}/definir-senha?token=${token} (vale por 24 horas).`,
    });
  }
}
