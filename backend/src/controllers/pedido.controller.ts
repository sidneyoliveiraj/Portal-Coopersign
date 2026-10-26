import { Request, Response } from "express";
import {
  pedidoService,
  PedidoInvalidoError,
  PedidoNaoEncontradoError,
} from "../services/pedido.service";

export async function criarPedidoController(req: Request, res: Response) {
  try {
    const service = pedidoService(req.prisma!);
    const pedido = await service.criar(req.body ?? {});
    return res.status(201).json({ pedido });
  } catch (erro) {
    if (erro instanceof PedidoInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function listarPedidosController(req: Request, res: Response) {
  const service = pedidoService(req.prisma!);
  const pedidos = await service.listar();
  return res.status(200).json({ pedidos });
}

export async function buscarPedidoController(req: Request, res: Response) {
  try {
    const service = pedidoService(req.prisma!);
    const pedido = await service.buscarPorId(req.params.id as string);
    return res.status(200).json({ pedido });
  } catch (erro) {
    if (erro instanceof PedidoNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}

export async function ajustarValorPedidoController(req: Request, res: Response) {
  try {
    const service = pedidoService(req.prisma!);
    const pedido = await service.ajustarValor(req.params.id as string, req.body ?? {});
    return res.status(200).json({ pedido });
  } catch (erro) {
    if (erro instanceof PedidoNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    if (erro instanceof PedidoInvalidoError) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
}
