import type { Request, Response } from "express";
import { faturamentoService, FaturamentoInvalidoError } from "../services/faturamento.service";
import { prismaDaRequisicao } from "../lib/requisicao";

function responderErro(erro: unknown, res: Response) {
  if (erro instanceof FaturamentoInvalidoError) {
    return res.status(400).json({ erro: erro.message });
  }
  throw erro;
}

export async function contaAbertaController(req: Request, res: Response) {
  try {
    const conta = await faturamentoService(prismaDaRequisicao(req)).contaAberta(req.query);
    return res.status(200).json(conta);
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function contasAbertasController(req: Request, res: Response) {
  try {
    const contas = await faturamentoService(prismaDaRequisicao(req)).contasAbertas(req.query);
    return res.status(200).json(contas);
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function fecharContaController(req: Request, res: Response) {
  try {
    const fechamento = await faturamentoService(prismaDaRequisicao(req)).fecharConta(req.body ?? {});
    return res.status(200).json(fechamento);
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function indicadoresController(req: Request, res: Response) {
  try {
    const indicadores = await faturamentoService(prismaDaRequisicao(req)).indicadores(req.query);
    return res.status(200).json(indicadores);
  } catch (erro) {
    return responderErro(erro, res);
  }
}
