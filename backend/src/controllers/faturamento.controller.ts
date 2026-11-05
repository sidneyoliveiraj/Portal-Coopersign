import { Request, Response } from "express";
import { faturamentoService, FaturamentoInvalidoError } from "../services/faturamento.service";

function responderErro(erro: unknown, res: Response) {
  if (erro instanceof FaturamentoInvalidoError) {
    return res.status(400).json({ erro: erro.message });
  }
  throw erro;
}

export async function contaAbertaController(req: Request, res: Response) {
  try {
    const conta = await faturamentoService(req.prisma!).contaAberta(req.query);
    return res.status(200).json(conta);
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function fecharContaController(req: Request, res: Response) {
  try {
    const fechamento = await faturamentoService(req.prisma!).fecharConta(req.body ?? {});
    return res.status(200).json(fechamento);
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function indicadoresController(req: Request, res: Response) {
  try {
    const indicadores = await faturamentoService(req.prisma!).indicadores(req.query);
    return res.status(200).json(indicadores);
  } catch (erro) {
    return responderErro(erro, res);
  }
}
