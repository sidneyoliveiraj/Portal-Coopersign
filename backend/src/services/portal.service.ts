import { PrismaTenantClient } from "../lib/prisma-tenant";

export class PedidoDoClienteNaoEncontradoError extends Error {
  constructor() {
    super("pedido nao encontrado");
    this.name = "PedidoDoClienteNaoEncontradoError";
  }
}

const dadosVisiveisAoCliente = {
  id: true,
  status: true,
  largura: true,
  altura: true,
  quantidade: true,
  acabamento: true,
  formaPagamento: true,
  prazoEntrega: true,
  metragemTotal: true,
  valorTotal: true,
  motivoRejeicao: true,
  criadoEm: true,
  concluidoEm: true,
  material: { select: { tipo: true } },
} as const;

export function portalService(prisma: PrismaTenantClient, usuarioId: string) {
  async function buscarClienteId() {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { clienteId: true } });
    return usuario?.clienteId ?? null;
  }

  async function listarPedidos() {
    const clienteId = await buscarClienteId();
    if (!clienteId) {
      return [];
    }
    return prisma.pedido.findMany({
      where: { clienteId },
      select: dadosVisiveisAoCliente,
      orderBy: { criadoEm: "desc" },
    });
  }

  async function buscarPedido(id: string) {
    const clienteId = await buscarClienteId();
    const pedido = clienteId
      ? await prisma.pedido.findFirst({ where: { id, clienteId }, select: dadosVisiveisAoCliente })
      : null;
    if (!pedido) {
      throw new PedidoDoClienteNaoEncontradoError();
    }
    return pedido;
  }

  return { listarPedidos, buscarPedido };
}
