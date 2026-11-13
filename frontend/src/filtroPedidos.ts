import type { Pedido } from "./tipos";

export type FiltroPedidos = {
  status: string[];
  clienteId: string | null;
  inicio: string; // AAAA-MM-DD, data de entrada (vazio = sem limite)
  fim: string;
  teveRetrabalho: boolean;
};

export const FILTRO_VAZIO: FiltroPedidos = { status: [], clienteId: null, inicio: "", fim: "", teveRetrabalho: false };

export function teveRetrabalho(pedido: Pedido) {
  return (pedido._count?.retrabalhos ?? 0) > 0;
}

/** Dia da entrada no fuso do navegador, no formato AAAA-MM-DD. */
export function diaLocal(momento: string) {
  return new Date(momento).toLocaleDateString("en-CA");
}

export function filtrarPedidos(pedidos: Pedido[], filtro: FiltroPedidos) {
  return pedidos.filter((pedido) => {
    if (filtro.status.length > 0 && !filtro.status.includes(pedido.status)) {
      return false;
    }
    if (filtro.clienteId && pedido.cliente.id !== filtro.clienteId) {
      return false;
    }
    if (filtro.teveRetrabalho && !teveRetrabalho(pedido)) {
      return false;
    }
    const dia = diaLocal(pedido.criadoEm);
    if (filtro.inicio && dia < filtro.inicio) {
      return false;
    }
    if (filtro.fim && dia > filtro.fim) {
      return false;
    }
    return true;
  });
}

export function filtroAtivo(filtro: FiltroPedidos) {
  return (
    filtro.status.length > 0 ||
    filtro.clienteId !== null ||
    filtro.inicio !== "" ||
    filtro.fim !== "" ||
    filtro.teveRetrabalho
  );
}
