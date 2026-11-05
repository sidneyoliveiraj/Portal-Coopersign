import { PrismaTenantClient } from "../lib/prisma-tenant";
import { filaRepository, StatusFila } from "../repositories/fila.repository";
import { maquinaRepository } from "../repositories/maquina.repository";
import { pedidoRepository } from "../repositories/pedido.repository";
import { MaquinaNaoEncontradaError } from "./maquina.service";
import { PedidoInvalidoError, PedidoNaoEncontradoError } from "./pedido.service";

const TRANSICOES: Record<StatusFila, string[]> = {
  EM_PRODUCAO: ["NA_FILA", "RETRABALHO"],
  CONCLUIDO: ["EM_PRODUCAO"],
};

export function filaService(prisma: PrismaTenantClient) {
  const repository = filaRepository(prisma);
  const maquinas = maquinaRepository(prisma);
  const pedidos = pedidoRepository(prisma);

  async function buscarPedido(id: string) {
    const pedido = await pedidos.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoError();
    }
    return pedido;
  }

  async function listar(maquinaId: string) {
    if (!(await maquinas.buscarPorId(maquinaId))) {
      throw new MaquinaNaoEncontradaError();
    }
    const [fila, concluidos] = await Promise.all([
      repository.listarFila(maquinaId),
      repository.listarConcluidos(maquinaId),
    ]);
    return { fila, concluidos };
  }

  async function atualizarStatus(id: string, dados: Record<string, unknown>) {
    const status = dados.status as StatusFila;
    const origensPermitidas = Object.hasOwn(TRANSICOES, String(status)) ? TRANSICOES[status] : null;
    if (!origensPermitidas) {
      throw new PedidoInvalidoError("status deve ser EM_PRODUCAO ou CONCLUIDO");
    }

    const pedido = await buscarPedido(id);
    if (!origensPermitidas.includes(pedido.status)) {
      throw new PedidoInvalidoError(`pedido em ${pedido.status} nao pode ir para ${status}`);
    }

    if (status === "CONCLUIDO") {
      await repository.concluir(id);
    } else {
      await repository.iniciarProducao(id, pedido.iniciadoEm ?? new Date());
    }
    return buscarPedido(id);
  }

  async function registrarRetrabalho(id: string, dados: Record<string, unknown>) {
    const motivo = typeof dados.motivo === "string" ? dados.motivo.trim() : "";
    if (!motivo) {
      throw new PedidoInvalidoError("motivo e obrigatorio");
    }

    const garantia = dados.garantia === true;
    const custoInformado = dados.custoOperacional;
    const semCusto = custoInformado === undefined || custoInformado === null || custoInformado === "";
    if (semCusto && garantia) {
      throw new PedidoInvalidoError("custoOperacional e obrigatorio em retrabalho de garantia");
    }

    const custoOperacional = semCusto ? null : Number(custoInformado);
    if (custoOperacional !== null && (!Number.isFinite(custoOperacional) || custoOperacional < 0)) {
      throw new PedidoInvalidoError("custoOperacional deve ser um numero maior ou igual a zero");
    }

    const pedido = await buscarPedido(id);
    const origensPermitidas = garantia ? ["CONCLUIDO"] : ["EM_PRODUCAO", "CONCLUIDO"];
    if (!origensPermitidas.includes(pedido.status)) {
      throw new PedidoInvalidoError(`pedido em ${pedido.status} nao aceita este retrabalho`);
    }

    await repository.registrarRetrabalho({ pedidoId: id, motivo, custoOperacional, garantia });
    return buscarPedido(id);
  }

  async function mover(id: string, dados: Record<string, unknown>) {
    const posicao = dados.posicao;
    if (typeof posicao !== "number" || !Number.isInteger(posicao) || posicao < 1) {
      throw new PedidoInvalidoError("posicao deve ser um numero inteiro maior ou igual a 1");
    }

    const pedido = await buscarPedido(id);
    if (!pedido.maquinaId) {
      throw new PedidoInvalidoError("pedido nao esta em uma fila");
    }

    const ids = (await repository.listarFila(pedido.maquinaId)).map((item) => item.id);
    const atual = ids.indexOf(id);
    if (atual === -1) {
      throw new PedidoInvalidoError("pedido nao esta em uma fila");
    }

    const destino = Math.min(posicao, ids.length) - 1;
    if (destino === atual) {
      return buscarPedido(id);
    }

    ids.splice(atual, 1);
    ids.splice(destino, 0, id);
    await repository.definirOrdem(ids);
    return buscarPedido(id);
  }

  return { listar, atualizarStatus, registrarRetrabalho, mover };
}
