import { Request, Response } from "express";
import {
  usuarioService,
  UsuarioInvalidoError,
  UsuarioNaoEncontradoError,
  UsuarioSemPermissaoError,
} from "../services/usuario.service";

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
  const usuarios = await usuarioService(req.prisma!).listar();
  return res.status(200).json({ usuarios });
}

export async function criarUsuarioController(req: Request, res: Response) {
  try {
    const usuario = await usuarioService(req.prisma!).criar(req.body ?? {}, req.usuario!);
    return res.status(201).json({ usuario });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function atualizarUsuarioController(req: Request, res: Response) {
  try {
    const usuario = await usuarioService(req.prisma!).atualizar(req.params.id as string, req.body ?? {}, req.usuario!);
    return res.status(200).json({ usuario });
  } catch (erro) {
    return responderErro(erro, res);
  }
}
