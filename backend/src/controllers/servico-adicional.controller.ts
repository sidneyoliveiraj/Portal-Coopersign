import type { Request, Response } from "express";
import {
  servicoAdicionalService,
  ServicoAdicionalInvalidoError,
  ServicoAdicionalNaoEncontradoError,
} from "../services/servico-adicional.service";
import { prismaDaRequisicao } from "../lib/requisicao";

export async function criarServicoAdicionalController(req: Request, res: Response) {
  try {
    const service = servicoAdicionalService(prismaDaRequisicao(req));
    const servicoAdicional = await service.criar(req.body);
    return res.status(201).json({ servicoAdicional });
  } catch (erro) {
    if (erro instanceof ServicoAdicionalInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function listarServicosAdicionaisController(req: Request, res: Response) {
  const service = servicoAdicionalService(prismaDaRequisicao(req));
  const servicosAdicionais = await service.listar();
  return res.status(200).json({ servicosAdicionais });
}

export async function buscarServicoAdicionalController(req: Request, res: Response) {
  try {
    const service = servicoAdicionalService(prismaDaRequisicao(req));
    const servicoAdicional = await service.buscarPorId(req.params.id as string);
    return res.status(200).json({ servicoAdicional });
  } catch (erro) {
    if (erro instanceof ServicoAdicionalNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function atualizarServicoAdicionalController(req: Request, res: Response) {
  try {
    const service = servicoAdicionalService(prismaDaRequisicao(req));
    const servicoAdicional = await service.atualizar(req.params.id as string, req.body);
    return res.status(200).json({ servicoAdicional });
  } catch (erro) {
    if (erro instanceof ServicoAdicionalNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    if (erro instanceof ServicoAdicionalInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function removerServicoAdicionalController(req: Request, res: Response) {
  try {
    const service = servicoAdicionalService(prismaDaRequisicao(req));
    await service.remover(req.params.id as string);
    return res.status(204).send();
  } catch (erro) {
    if (erro instanceof ServicoAdicionalNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}
