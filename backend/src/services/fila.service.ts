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

type ItemFila = { posicaoFila?: number | null; prazoEntrega?: Date | null };

// RN11 com a ordem manual do gestor (RF23): quem ja tem posicao fica como o gestor deixou, e o pedido
// que chegou depois (aprovado ou voltando de retrabalho) entra logo apos o ultimo que vence antes ou no
// mesmo dia que ele. Sem nenhuma posicao manual, a fila ja vem do banco ordenada por prazo.
export function encaixarPorPrazo<T extends ItemFila>(itens: T[]): T[] {
  const manuais = itens.filter((item) => item.posicaoFila !== null && item.posicaoFila !== undefined);
  if (manuais.length === 0) {
    return itens;
  }
  const prazo = (item: T) => item.prazoEntrega?.getTime() ?? Infinity;
  const fila = [...manuais];
  for (const novo of itens.filter((item) => !manuais.includes(item))) {
    let destino = 0;
    fila.forEach((item, indice) => {
      if (prazo(item) <= prazo(novo)) {
        destino = indice + 1;
      }
    });
    fila.splice(destino, 0, novo);
  }
  return fila;
}

function conferirGravacao({ count }: { count: number }) {
  if (count !== 1) {
    throw new PedidoInvalidoError("o pedido mudou de status enquanto era atualizado; atualize a fila");
  }
}

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
    return { fila: encaixarPorPrazo(fila), concluidos };
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
        conferirGravacao(await repository.voltarParaFila(id, pedido.status, "RETRABALHO", pedido.iniciadoEm));
      } else {
        conferirGravacao(await repository.voltarParaFila(id, pedido.status, "NA_FILA", null));
      }
    } else if (status === "CONCLUIDO") {
      if (refazendo) {
        const ultimo = pedido.retrabalhos?.at(-1);
        const statusFinal: OrigemRetrabalho = ultimo?.statusOrigem === "FATURADO" ? "FATURADO" : "CONCLUIDO";
        conferirGravacao(await repository.concluir(id, pedido.status, statusFinal, pedido.concluidoEm!));
      } else {
        conferirGravacao(await repository.concluir(id, pedido.status, "CONCLUIDO", new Date()));
      }
    } else {
      conferirGravacao(await repository.iniciarProducao(id, pedido.status, pedido.iniciadoEm ?? new Date()));
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

    conferirGravacao({ count: await repository.registrarRetrabalho({ pedidoId: id, motivo, custoOperacional, statusOrigem }) });
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

    const ids = encaixarPorPrazo(await repository.listarFila(pedido.maquinaId)).map((item) => item.id);
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
