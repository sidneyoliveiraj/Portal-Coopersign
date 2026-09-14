import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { compararSenha, gerarToken } from "../services/auth.service";

export async function loginController(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "email e senha sao obrigatorios" });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: "credenciais invalidas" });
  }

  const senhaConfere = await compararSenha(senha, usuario.senhaHash);

  if (!senhaConfere) {
    return res.status(401).json({ erro: "credenciais invalidas" });
  }

  const token = gerarToken({
    usuarioId: usuario.id,
    organizacaoId: usuario.organizacaoId,
    perfil: usuario.perfil,
  });

  return res.status(200).json({ token });
}

export function meController(req: Request, res: Response) {
  return res.status(200).json({ usuario: req.usuario });
}
