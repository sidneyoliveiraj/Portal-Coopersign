import { Request, Response } from "express";
import {
  clienteService,
  ClienteInvalidoError,
  ClienteNaoEncontradoError,
} from "../services/cliente.service";

export async function criarClienteController(req: Request, res: Response) {
  try {
    const service = clienteService(req.prisma!);
    const cliente = await service.criar(req.body);
    return res.status(201).json({ cliente });
  } catch (erro) {
    if (erro instanceof ClienteInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function listarClientesController(req: Request, res: Response) {
  const service = clienteService(req.prisma!);
  const clientes = await service.listar();
  return res.status(200).json({ clientes });
}

export async function buscarClienteController(req: Request, res: Response) {
  try {
    const service = clienteService(req.prisma!);
    const cliente = await service.buscarPorId(req.params.id as string);
    return res.status(200).json({ cliente });
  } catch (erro) {
    if (erro instanceof ClienteNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function atualizarClienteController(req: Request, res: Response) {
  try {
    const service = clienteService(req.prisma!);
    const cliente = await service.atualizar(req.params.id as string, req.body);
    return res.status(200).json({ cliente });
  } catch (erro) {
    if (erro instanceof ClienteNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    if (erro instanceof ClienteInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function removerClienteController(req: Request, res: Response) {
  try {
    const service = clienteService(req.prisma!);
    await service.remover(req.params.id as string);
    return res.status(204).send();
  } catch (erro) {
    if (erro instanceof ClienteNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}
