import { PrismaTenantClient } from "../lib/prisma-tenant";
import { filaRepository, StatusFila } from "../repositories/fila.repository";
import { maquinaRepository } from "../repositories/maquina.repository";
import { pedidoRepository } from "../repositories/pedido.repository";
import { MaquinaNaoEncontradaError } from "./maquina.service";
import { PedidoInvalidoError, PedidoNaoEncontradoError } from "./pedido.service";

const TRANSICOES: Record<StatusFila, string[]> = {
  NA_FILA: ["EM_PRODUCAO"],
  EM_PRODUCAO: ["NA_FILA", "RETRABALHO"],
  CONCLUIDO: ["EM_PRODUCAO"],
};

const ORIGENS_RETRABALHO = ["CONCLUIDO", "FATURADO"] as const;
type OrigemRetrabalho = (typeof ORIGENS_RETRABALHO)[number];

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
      throw new PedidoInvalidoError("status deve ser NA_FILA, EM_PRODUCAO ou CONCLUIDO");
    }

    const pedido = await buscarPedido(id);
    if (!origensPermitidas.includes(pedido.status)) {
      throw new PedidoInvalidoError(`pedido em ${pedido.status} nao pode ir para ${status}`);
    }

    // concluidoEm preenchido indica que o pedido ja foi entregue uma vez e esta sendo refeito
    const refazendo = pedido.concluidoEm !== null && pedido.concluidoEm !== undefined;

    if (status === "NA_FILA") {
      if (refazendo) {
        await repository.voltarParaFila(id, "RETRABALHO", pedido.iniciadoEm);
      } else {
        await repository.voltarParaFila(id, "NA_FILA", null);
      }
    } else if (status === "CONCLUIDO") {
      if (refazendo) {
        const ultimo = pedido.retrabalhos?.at(-1);
        const statusFinal: OrigemRetrabalho = ultimo?.statusOrigem === "FATURADO" ? "FATURADO" : "CONCLUIDO";
        await repository.concluir(id, statusFinal, pedido.concluidoEm!);
      } else {
        await repository.concluir(id, "CONCLUIDO", new Date());
      }
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

    const custoInformado = dados.custoOperacional;
    const custoOperacional =
      custoInformado === undefined || custoInformado === null || custoInformado === "" ? NaN : Number(custoInformado);
    if (!Number.isFinite(custoOperacional) || custoOperacional <= 0) {
      throw new PedidoInvalidoError("custoOperacional e obrigatorio e deve ser maior que zero");
    }

    const pedido = await buscarPedido(id);
    const statusOrigem = pedido.status as OrigemRetrabalho;
    if (!ORIGENS_RETRABALHO.includes(statusOrigem)) {
      throw new PedidoInvalidoError("so pedido concluido ou faturado aceita retrabalho");
    }
    if (!pedido.maquinaId) {
      throw new PedidoInvalidoError("pedido nao tem maquina para voltar a fila");
    }

    await repository.registrarRetrabalho({ pedidoId: id, motivo, custoOperacional, statusOrigem });
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
