import { PrismaTenantClient } from "../lib/prisma-tenant";
import { pedidoRepository } from "../repositories/pedido.repository";
import { clienteRepository } from "../repositories/cliente.repository";
import { materialRepository } from "../repositories/material.repository";
import { servicoAdicionalRepository } from "../repositories/servico-adicional.repository";
import {
  calcularMetragem,
  calcularValorBase,
  calcularValorTotal,
  DimensaoInvalidaError,
} from "./pedido-calculo.service";

export class PedidoNaoEncontradoError extends Error {
  constructor() {
    super("pedido nao encontrado");
    this.name = "PedidoNaoEncontradoError";
  }
}

export class PedidoInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "PedidoInvalidoError";
  }
}

const FORMAS_PAGAMENTO = ["A_VISTA", "EM_CONTA"] as const;
type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new PedidoInvalidoError(`${campo} e obrigatorio`);
  }
  return valor.trim();
}

function numero(valor: unknown, campo: string): number {
  const convertido = typeof valor === "string" ? Number(valor) : valor;
  if (typeof convertido !== "number" || Number.isNaN(convertido)) {
    throw new PedidoInvalidoError(`${campo} deve ser um numero`);
  }
  return convertido;
}

function data(valor: unknown, campo: string): Date {
  const convertida = new Date(texto(valor, campo));
  if (Number.isNaN(convertida.getTime())) {
    throw new PedidoInvalidoError(`${campo} deve ser uma data valida`);
  }
  return convertida;
}

function formaPagamento(valor: unknown): FormaPagamento {
  if (valor === undefined) {
    return "A_VISTA";
  }
  if (!FORMAS_PAGAMENTO.includes(valor as FormaPagamento)) {
    throw new PedidoInvalidoError("formaPagamento deve ser A_VISTA ou EM_CONTA");
  }
  return valor as FormaPagamento;
}

type ServicoSolicitado = { servicoAdicionalId: string; quantidade: number };

function servicosSolicitados(valor: unknown): ServicoSolicitado[] {
  if (valor === undefined) {
    return [];
  }
  if (!Array.isArray(valor)) {
    throw new PedidoInvalidoError("servicos deve ser uma lista");
  }
  return valor.map((item) => {
    const quantidade = item?.quantidade === undefined ? 1 : numero(item.quantidade, "quantidade do servico");
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new PedidoInvalidoError("quantidade do servico deve ser um inteiro maior que zero");
    }
    return { servicoAdicionalId: texto(item?.servicoAdicionalId, "servicoAdicionalId"), quantidade };
  });
}

export function pedidoService(prisma: PrismaTenantClient) {
  const repository = pedidoRepository(prisma);
  const clientes = clienteRepository(prisma);
  const materiais = materialRepository(prisma);
  const servicosAdicionais = servicoAdicionalRepository(prisma);

  async function criar(dados: Record<string, unknown>) {
    const clienteId = texto(dados.clienteId, "clienteId");
    const materialId = texto(dados.materialId, "materialId");
    const largura = numero(dados.largura, "largura");
    const altura = numero(dados.altura, "altura");
    const quantidade = numero(dados.quantidade, "quantidade");
    const acabamento = texto(dados.acabamento, "acabamento");
    const arquivoUrl = texto(dados.arquivoUrl, "arquivoUrl");
    const prazoEntrega = data(dados.prazoEntrega, "prazoEntrega");
    const pagamento = formaPagamento(dados.formaPagamento);
    const servicos = servicosSolicitados(dados.servicos);

    let metragem: number;
    try {
      metragem = calcularMetragem(largura, altura, quantidade);
    } catch (erro) {
      if (erro instanceof DimensaoInvalidaError) {
        throw new PedidoInvalidoError(erro.message);
      }
      throw erro;
    }

    if (!(await clientes.buscarPorId(clienteId))) {
      throw new PedidoInvalidoError("cliente nao encontrado");
    }

    const material = await materiais.buscarPorId(materialId);
    if (!material) {
      throw new PedidoInvalidoError("material nao encontrado");
    }

    const itensServico = [];
    for (const servico of servicos) {
      const cadastrado = await servicosAdicionais.buscarPorId(servico.servicoAdicionalId);
      if (!cadastrado) {
        throw new PedidoInvalidoError("servico adicional nao encontrado");
      }
      itensServico.push({
        servicoAdicionalId: cadastrado.id,
        quantidade: servico.quantidade,
        valorUnitario: Number(cadastrado.valorPadrao),
      });
    }

    const valorBase = arredondar(calcularValorBase(metragem, Number(material.precoM2)));
    const valorTotal = arredondar(
      calcularValorTotal(
        valorBase,
        itensServico.map((item) => item.valorUnitario * item.quantidade),
        [],
      ),
    );

    return repository.criar({
      clienteId,
      materialId,
      largura,
      altura,
      quantidade,
      acabamento,
      arquivoUrl,
      prazoEntrega,
      formaPagamento: pagamento,
      status: "AGUARDANDO_VALIDACAO",
      metragemTotal: arredondar(metragem),
      valorBase,
      valorTotal,
      pedidoServicos: { create: itensServico },
    });
  }

  function listar() {
    return repository.listar();
  }

  async function buscarPorId(id: string) {
    const pedido = await repository.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoError();
    }
    return pedido;
  }

  async function ajustarValor(id: string, dados: Record<string, unknown>) {
    const justificativa = texto(dados.justificativa, "justificativa");
    const valor = numero(dados.valor, "valor");
    if (valor === 0) {
      throw new PedidoInvalidoError("valor do ajuste nao pode ser zero");
    }

    const pedido = await buscarPorId(id);
    if (pedido.status === "FATURADO") {
      throw new PedidoInvalidoError("pedido ja faturado nao pode receber ajuste");
    }

    const novoValorTotal = arredondar(Number(pedido.valorTotal) + valor);
    if (novoValorTotal < 0) {
      throw new PedidoInvalidoError("ajuste deixaria o valor total negativo");
    }

    await repository.registrarAjuste(id, justificativa, valor, novoValorTotal);
    return buscarPorId(id);
  }

  return { criar, listar, buscarPorId, ajustarValor };
}
