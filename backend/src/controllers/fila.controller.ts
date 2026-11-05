import { Request, Response } from "express";
import { filaService } from "../services/fila.service";
import { MaquinaNaoEncontradaError } from "../services/maquina.service";
import { PedidoInvalidoError, PedidoNaoEncontradoError } from "../services/pedido.service";

function responderErro(erro: unknown, res: Response) {
  if (erro instanceof PedidoNaoEncontradoError || erro instanceof MaquinaNaoEncontradaError) {
    return res.status(404).json({ erro: erro.message });
  }
  if (erro instanceof PedidoInvalidoError) {
    return res.status(400).json({ erro: erro.message });
  }
  throw erro;
}

export async function listarFilaController(req: Request, res: Response) {
  try {
    const resultado = await filaService(req.prisma!).listar(req.params.maquinaId as string);
    return res.status(200).json(resultado);
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function atualizarStatusController(req: Request, res: Response) {
  try {
    const pedido = await filaService(req.prisma!).atualizarStatus(req.params.id as string, req.body ?? {});
    return res.status(200).json({ pedido });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function registrarRetrabalhoController(req: Request, res: Response) {
  try {
    const pedido = await filaService(req.prisma!).registrarRetrabalho(req.params.id as string, req.body ?? {});
    return res.status(201).json({ pedido });
  } catch (erro) {
    return responderErro(erro, res);
  }
}

export async function moverNaFilaController(req: Request, res: Response) {
  try {
    const pedido = await filaService(req.prisma!).mover(req.params.id as string, req.body ?? {});
    return res.status(200).json({ pedido });
  } catch (erro) {
    return responderErro(erro, res);
  }
}
