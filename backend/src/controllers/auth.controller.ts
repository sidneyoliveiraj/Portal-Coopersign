import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { compararSenha, gerarToken } from "../services/auth.service";
import { cadastrarCliente, CadastroInvalidoError } from "../services/cadastro-cliente.service";

export async function loginController(req: Request, res: Response) {
  const { email, senha, organizacaoId } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "email e senha sao obrigatorios" });
  }

  const candidatos = await prisma.usuario.findMany({
    where: { email, ...(organizacaoId ? { organizacaoId } : {}) },
  });

  const comSenhaCorreta = [];
  for (const candidato of candidatos) {
    if (await compararSenha(senha, candidato.senhaHash)) {
      comSenhaCorreta.push(candidato);
    }
  }

  if (comSenhaCorreta.length === 0) {
    return res.status(401).json({ erro: "credenciais invalidas" });
  }

  const autenticados = comSenhaCorreta.filter((candidato) => candidato.ativo);

  if (autenticados.length === 0) {
    const aguardandoAprovacao = comSenhaCorreta.some((candidato) => candidato.perfil === "CLIENTE");
    return res.status(403).json({
      erro: aguardandoAprovacao ? "cadastro inativo ou aguardando aprovacao do gestor" : "usuario inativo",
    });
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

export async function cadastroClienteController(req: Request, res: Response) {
  try {
    await cadastrarCliente(req.body ?? {});
    return res.status(201).json({ mensagem: "cadastro recebido, aguardando aprovacao do gestor" });
  } catch (erro) {
    if (erro instanceof CadastroInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export function meController(req: Request, res: Response) {
  return res.status(200).json({ usuario: req.usuario });
}
