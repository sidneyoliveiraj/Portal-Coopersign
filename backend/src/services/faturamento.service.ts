import { PrismaTenantClient } from "../lib/prisma-tenant";
import { clienteRepository } from "../repositories/cliente.repository";
import { faturamentoRepository, Periodo } from "../repositories/faturamento.repository";

export class FaturamentoInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "FaturamentoInvalidoError";
  }
}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FUSO_BRASIL = "-03:00";

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function dataDoDia(valor: unknown, campo: string, horario: string): Date {
  if (typeof valor !== "string" || !FORMATO_DATA.test(valor)) {
    throw new FaturamentoInvalidoError(`${campo} deve estar no formato AAAA-MM-DD`);
  }
  const data = new Date(`${valor}T${horario}${FUSO_BRASIL}`);
  if (Number.isNaN(data.getTime())) {
    throw new FaturamentoInvalidoError(`${campo} deve ser uma data valida`);
  }
  return data;
}

function periodo(dados: Record<string, unknown>): Periodo {
  const inicio = dataDoDia(dados.inicio, "inicio", "00:00:00.000");
  const fim = dataDoDia(dados.fim, "fim", "23:59:59.999");
  if (inicio > fim) {
    throw new FaturamentoInvalidoError("inicio nao pode ser depois de fim");
  }
  return { inicio, fim };
}

function somarValores(pedidos: { valorTotal: unknown }[]): number {
  return arredondar(pedidos.reduce((soma, pedido) => soma + Number(pedido.valorTotal), 0));
}

type RetrabalhoDoPeriodo = { garantia: boolean; custoOperacional: unknown };

function resumirRetrabalhos(retrabalhos: RetrabalhoDoPeriodo[]) {
  const comCusto = retrabalhos.filter((r) => r.custoOperacional !== null);
  return {
    quantidade: retrabalhos.length,
    custoInformado: arredondar(comCusto.reduce((soma, r) => soma + Number(r.custoOperacional), 0)),
    semCusto: retrabalhos.length - comCusto.length,
  };
}

export function faturamentoService(prisma: PrismaTenantClient) {
  const repository = faturamentoRepository(prisma);
  const clientes = clienteRepository(prisma);

  async function contaAberta(dados: Record<string, unknown>) {
    const clienteId = dados.clienteId;
    if (typeof clienteId !== "string" || !clienteId) {
      throw new FaturamentoInvalidoError("clienteId e obrigatorio");
    }
    const intervalo = periodo(dados);
    if (!(await clientes.buscarPorId(clienteId))) {
      throw new FaturamentoInvalidoError("cliente nao encontrado");
    }
    const pedidos = await repository.listarContaAberta(clienteId, intervalo);
    return { pedidos, total: somarValores(pedidos) };
  }

  async function fecharConta(dados: Record<string, unknown>) {
    const { pedidos, total } = await contaAberta(dados);
    if (pedidos.length === 0) {
      throw new FaturamentoInvalidoError("nao ha pedidos em conta concluidos neste periodo");
    }
    await repository.marcarFaturados(pedidos.map((pedido) => pedido.id));
    return { quantidade: pedidos.length, total, pedidos };
  }

  async function indicadores(dados: Record<string, unknown>) {
    const intervalo = periodo(dados);
    const [concluidos, comRetrabalho] = await Promise.all([
      repository.listarConcluidos(intervalo),
      repository.listarComRetrabalho(intervalo),
    ]);

    const porMaquina = new Map<string, number>();
    for (const pedido of concluidos) {
      const nome = pedido.maquina?.nome ?? "Sem máquina";
      porMaquina.set(nome, (porMaquina.get(nome) ?? 0) + 1);
    }

    const duracoes = concluidos
      .filter((pedido) => pedido.iniciadoEm && pedido.concluidoEm)
      .map((pedido) => pedido.concluidoEm!.getTime() - pedido.iniciadoEm!.getTime());
    const tempoMedioHoras =
      duracoes.length > 0
        ? Math.round((duracoes.reduce((soma, d) => soma + d, 0) / duracoes.length / 3_600_000) * 10) / 10
        : null;

    const retrabalhos = comRetrabalho.flatMap((pedido) => pedido.retrabalhos);

    return {
      receitaTotal: somarValores(concluidos),
      receitaPorForma: {
        A_VISTA: somarValores(concluidos.filter((p) => p.formaPagamento === "A_VISTA")),
        EM_CONTA: somarValores(concluidos.filter((p) => p.formaPagamento === "EM_CONTA")),
      },
      pedidosConcluidos: concluidos.length,
      pedidosPorMaquina: [...porMaquina].map(([maquina, quantidade]) => ({ maquina, quantidade })),
      taxaRetrabalho:
        concluidos.length > 0 ? Math.round((retrabalhos.length / concluidos.length) * 1000) / 10 : null,
      tempoMedioHoras,
      retrabalhoProducao: resumirRetrabalhos(retrabalhos.filter((r) => !r.garantia)),
      retrabalhoGarantia: resumirRetrabalhos(retrabalhos.filter((r) => r.garantia)),
      pedidos: concluidos,
    };
  }

  return { contaAberta, fecharConta, indicadores };
}
