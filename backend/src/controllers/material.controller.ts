import { Request, Response } from "express";
import {
  materialService,
  MaterialInvalidoError,
  MaterialNaoEncontradoError,
} from "../services/material.service";

export async function criarMaterialController(req: Request, res: Response) {
  try {
    const service = materialService(req.prisma!);
    const material = await service.criar(req.body);
    return res.status(201).json({ material });
  } catch (erro) {
    if (erro instanceof MaterialInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function listarMateriaisController(req: Request, res: Response) {
  const service = materialService(req.prisma!);
  const materiais = await service.listar();
  return res.status(200).json({ materiais });
}

export async function buscarMaterialController(req: Request, res: Response) {
  try {
    const service = materialService(req.prisma!);
    const material = await service.buscarPorId(req.params.id as string);
    return res.status(200).json({ material });
  } catch (erro) {
    if (erro instanceof MaterialNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function atualizarMaterialController(req: Request, res: Response) {
  try {
    const service = materialService(req.prisma!);
    const material = await service.atualizar(req.params.id as string, req.body);
    return res.status(200).json({ material });
  } catch (erro) {
    if (erro instanceof MaterialNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    if (erro instanceof MaterialInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function removerMaterialController(req: Request, res: Response) {
  try {
    const service = materialService(req.prisma!);
    await service.remover(req.params.id as string);
    return res.status(204).send();
  } catch (erro) {
    if (erro instanceof MaterialNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}
