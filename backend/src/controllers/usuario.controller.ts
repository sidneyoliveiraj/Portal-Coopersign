import type { Request, Response } from "express";
import {
  usuarioService,
  UsuarioInvalidoError,
  UsuarioNaoEncontradoError,
  UsuarioSemPermissaoError,
} from "../services/usuario.service";
import { prismaDaRequisicao, usuarioDaRequisicao } from "../lib/requisicao";

function responderErro(erro: unknown, res: Response) {
  if (erro instanceof UsuarioInvalidoError) {
    return res.status(400).json({ erro: erro.message });
  }
  if (erro instanceof UsuarioSemPermissaoError) {
    return res.status(403).json({ erro: erro.message });
  }
  if (erro instanceof UsuarioNaoEncontradoError) {
    return res.status(404).json({ erro: erro.message });
  }
  throw erro;
}

export async function listarUsuariosController(req: Request, res: Response) {
  const usuarios = await usuarioService(prismaDaRequisicao(req)).listar();
  return res.status(200).json({ usuarios });
}

export async function listarContasClientesController(req: Request, res: Response) {
  const usuarios = await usuarioService(prismaDaRequisicao(req)).listarContasClientes();
  return res.status(200).json({ usuarios });
}

export async function criarContaClienteController(req: Request, res: Response) {
  try {
    const { usuario, tokenConvite } = await usuarioService(prismaDaRequisicao(req)).criarContaCliente(req.body ?? {});
    return res.status(201).json({ usuario, tokenConvite });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function aprovarClienteController(req: Request, res: Response) {
  try {
    const usuario = await usuarioService(prismaDaRequisicao(req)).aprovarCliente(req.params.id as string);
    return res.status(200).json({ usuario });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function criarUsuarioController(req: Request, res: Response) {
  try {
    const usuario = await usuarioService(prismaDaRequisicao(req)).criar(req.body ?? {}, usuarioDaRequisicao(req));
    return res.status(201).json({ usuario });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function atualizarUsuarioController(req: Request, res: Response) {
  try {
    const usuario = await usuarioService(prismaDaRequisicao(req)).atualizar(req.params.id as string, req.body ?? {}, usuarioDaRequisicao(req));
    return res.status(200).json({ usuario });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function gerarLinkSenhaController(req: Request, res: Response) {
  try {
    const token = await usuarioService(prismaDaRequisicao(req)).gerarLinkSenha(req.params.id as string, usuarioDaRequisicao(req));
    return res.status(201).json({ token });
  } catch (erro) {
    return responderErro(erro, res);
  }
}
