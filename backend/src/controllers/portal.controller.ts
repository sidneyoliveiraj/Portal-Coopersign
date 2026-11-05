import { Request, Response } from "express";
import { portalService, PedidoDoClienteNaoEncontradoError } from "../services/portal.service";

export async function listarMeusPedidosController(req: Request, res: Response) {
  const pedidos = await portalService(req.prisma!, req.usuario!.usuarioId).listarPedidos();
  return res.status(200).json({ pedidos });
}

export async function buscarMeuPedidoController(req: Request, res: Response) {
  try {
    const pedido = await portalService(req.prisma!, req.usuario!.usuarioId).buscarPedido(req.params.id as string);
    return res.status(200).json({ pedido });
  } catch (erro) {
    if (erro instanceof PedidoDoClienteNaoEncontradoError) {
      return res.status(404).json({ erro: erro.message });
    }
    throw erro;
  }
}
