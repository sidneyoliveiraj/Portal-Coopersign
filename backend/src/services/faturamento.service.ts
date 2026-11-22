import type { PrismaTenantClient } from "../lib/prisma-tenant";
import { clienteRepository } from "../repositories/cliente.repository";
import { ContaAlteradaError, faturamentoRepository, type Periodo } from "../repositories/faturamento.repository";
import { calcularMetragemCobrada } from "./pedido-calculo.service";

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

// "AAAA-MM" no horario de Brasilia: um pedido concluido em 31/10 as 22h e de outubro, nao de novembro.
function mesNoBrasil(data: Date): string {
  return new Date(data.getTime() - 3 * 3_600_000).toISOString().slice(0, 7);
}

function mesesDoPeriodo({ inicio, fim }: Periodo): string[] {
  const meses: string[] = [];
  let [ano, mes] = mesNoBrasil(inicio).split("-").map(Number);
  const ultimo = mesNoBrasil(fim);
  for (;;) {
    const atual = `${ano}-${String(mes).padStart(2, "0")}`;
    meses.push(atual);
    if (atual >= ultimo) {
      return meses;
    }
    mes = mes === 12 ? 1 : mes + 1;
    ano = mes === 1 ? ano + 1 : ano;
  }
}

type PedidoConcluido = {
  concluidoEm: Date | null;
  valorTotal: unknown;
  metragemTotal: unknown;
  largura: unknown;
  altura: unknown;
  quantidade: number;
};

// Relatorio mes a mes (RF25): pedidos, m2 rodados (real), m2 cobrados (RN16) e receita.
// Meses sem pedido aparecem zerados, como na planilha do gestor.
export function resumoPorMes(pedidos: PedidoConcluido[], intervalo: Periodo) {
  const meses = new Map(
    mesesDoPeriodo(intervalo).map((mes) => [mes, { mes, pedidos: 0, metragem: 0, metragemCobrada: 0, receita: 0 }]),
  );
  for (const pedido of pedidos) {
    const linha = pedido.concluidoEm && meses.get(mesNoBrasil(pedido.concluidoEm));
    if (!linha) {
      continue;
    }
    linha.pedidos += 1;
    linha.metragem += Number(pedido.metragemTotal);
    linha.metragemCobrada += calcularMetragemCobrada(
      Number(pedido.largura),
      Number(pedido.altura),
      pedido.quantidade,
    );
    linha.receita += Number(pedido.valorTotal);
  }
  const linhas = [...meses.values()].map((linha) => ({
    ...linha,
    metragem: arredondar(linha.metragem),
    metragemCobrada: arredondar(linha.metragemCobrada),
    receita: arredondar(linha.receita),
  }));
  const total = linhas.reduce(
    (soma, linha) => ({
      pedidos: soma.pedidos + linha.pedidos,
      metragem: arredondar(soma.metragem + linha.metragem),
      metragemCobrada: arredondar(soma.metragemCobrada + linha.metragemCobrada),
      receita: arredondar(soma.receita + linha.receita),
    }),
    { pedidos: 0, metragem: 0, metragemCobrada: 0, receita: 0 },
  );
  return { meses: linhas, total };
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

  // Todos os clientes com pedido em conta concluido no periodo, para quem nao lembra quem deve.
  async function contasAbertas(dados: Record<string, unknown>) {
    const pedidos = await repository.listarContasAbertas(periodo(dados));
    const porCliente = new Map<string, { clienteId: string; nome: string; quantidade: number; total: number }>();
    for (const pedido of pedidos) {
      const atual = porCliente.get(pedido.clienteId) ?? {
        clienteId: pedido.clienteId,
        nome: pedido.cliente.nome,
        quantidade: 0,
        total: 0,
      };
      atual.quantidade += 1;
      atual.total = arredondar(atual.total + Number(pedido.valorTotal));
      porCliente.set(pedido.clienteId, atual);
    }
    const clientes = [...porCliente.values()].sort((a, b) => b.total - a.total);
    return { clientes, total: somarValores(pedidos) };
  }

  async function fecharConta(dados: Record<string, unknown>) {
    const { pedidos, total } = await contaAberta(dados);
    if (pedidos.length === 0) {
      throw new FaturamentoInvalidoError("nao ha pedidos em conta concluidos ate o fim deste periodo");
    }
    try {
      await repository.marcarFaturados(pedidos.map((pedido) => pedido.id));
    } catch (erro) {
      if (erro instanceof ContaAlteradaError) {
        throw new FaturamentoInvalidoError("a conta mudou enquanto era fechada; busque a conta de novo");
      }
      throw erro;
    }
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

    const porMaterial = new Map<string, { quantidade: number; metragem: number }>();
    for (const pedido of concluidos) {
      const atual = porMaterial.get(pedido.material.tipo) ?? { quantidade: 0, metragem: 0 };
      porMaterial.set(pedido.material.tipo, {
        quantidade: atual.quantidade + 1,
        metragem: atual.metragem + Number(pedido.metragemTotal),
      });
    }

    const duracoes = concluidos.flatMap(({ iniciadoEm, concluidoEm }) =>
      iniciadoEm && concluidoEm ? [concluidoEm.getTime() - iniciadoEm.getTime()] : [],
    );
    const tempoMedioHoras =
      duracoes.length > 0
        ? Math.round((duracoes.reduce((soma, d) => soma + d, 0) / duracoes.length / 3_600_000) * 10) / 10
        : null;

    const retrabalhos = comRetrabalho
      .flatMap((pedido) =>
        pedido.retrabalhos.map((r) => ({
          id: r.id,
          pedidoId: pedido.id,
          data: r.criadoEm,
          cliente: pedido.cliente.nome,
          material: pedido.material.tipo,
          motivo: r.motivo,
          custo: Number(r.custoOperacional),
        })),
      )
      .sort((a, b) => b.data.getTime() - a.data.getTime());

    return {
      receitaTotal: somarValores(concluidos),
      receitaPorForma: {
        A_VISTA: somarValores(concluidos.filter((p) => p.formaPagamento === "A_VISTA")),
        EM_CONTA: somarValores(concluidos.filter((p) => p.formaPagamento === "EM_CONTA")),
      },
      pedidosConcluidos: concluidos.length,
      pedidosPorMaquina: [...porMaquina].map(([maquina, quantidade]) => ({ maquina, quantidade })),
      pedidosPorMaterial: [...porMaterial]
        .map(([material, { quantidade, metragem }]) => ({ material, quantidade, metragem: arredondar(metragem) }))
        .sort((a, b) => b.metragem - a.metragem),
      // Dos pedidos concluidos no periodo, quantos % precisaram ser refeitos (nunca passa de 100%).
      taxaRetrabalho:
        concluidos.length > 0
          ? Math.round((concluidos.filter((p) => p._count.retrabalhos > 0).length / concluidos.length) * 1000) / 10
          : null,
      tempoMedioHoras,
      custoRetrabalho: arredondar(retrabalhos.reduce((soma, r) => soma + r.custo, 0)),
      retrabalhos,
      porMes: resumoPorMes(concluidos, intervalo),
      pedidos: concluidos,
    };
  }

  return { contaAberta, contasAbertas, fecharConta, indicadores };
}
