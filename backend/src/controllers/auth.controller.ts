import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { compararSenha, gerarToken } from "../services/auth.service";

export async function loginController(req: Request, res: Response) {
  const { email, senha, organizacaoId } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "email e senha sao obrigatorios" });
  }

  const candidatos = await prisma.usuario.findMany({
    where: { email, ativo: true, ...(organizacaoId ? { organizacaoId } : {}) },
  });

  const autenticados = [];
  for (const candidato of candidatos) {
    if (await compararSenha(senha, candidato.senhaHash)) {
      autenticados.push(candidato);
    }
  }

  if (autenticados.length === 0) {
    return res.status(401).json({ erro: "credenciais invalidas" });
  }

  if (autenticados.length > 1) {
    return res
      .status(400)
      .json({ erro: "email cadastrado em mais de uma organizacao, informe organizacaoId" });
  }

  const usuario = autenticados[0];

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
