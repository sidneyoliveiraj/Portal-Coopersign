import { Request, Response } from "express";
import {
  maquinaService,
  MaquinaInvalidaError,
  MaquinaNaoEncontradaError,
} from "../services/maquina.service";

export async function criarMaquinaController(req: Request, res: Response) {
  try {
    const service = maquinaService(req.prisma!);
    const maquina = await service.criar(req.body);
    return res.status(201).json({ maquina });
  } catch (erro) {
    if (erro instanceof MaquinaInvalidaError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function listarMaquinasController(req: Request, res: Response) {
  const service = maquinaService(req.prisma!);
  const maquinas = await service.listar();
  return res.status(200).json({ maquinas });
}

export async function buscarMaquinaController(req: Request, res: Response) {
  try {
    const service = maquinaService(req.prisma!);
    const maquina = await service.buscarPorId(req.params.id as string);
    return res.status(200).json({ maquina });
  } catch (erro) {
    if (erro instanceof MaquinaNaoEncontradaError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function atualizarMaquinaController(req: Request, res: Response) {
  try {
    const service = maquinaService(req.prisma!);
    const maquina = await service.atualizar(req.params.id as string, req.body);
    return res.status(200).json({ maquina });
  } catch (erro) {
    if (erro instanceof MaquinaNaoEncontradaError) {
      return res.status(404).json({ erro: erro.message });
    }
    if (erro instanceof MaquinaInvalidaError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function removerMaquinaController(req: Request, res: Response) {
  try {
    const service = maquinaService(req.prisma!);
    await service.remover(req.params.id as string);
    return res.status(204).send();
  } catch (erro) {
    if (erro instanceof MaquinaNaoEncontradaError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}
