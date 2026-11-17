import { PrismaTenantClient } from "../lib/prisma-tenant";
import {
  servicoAdicionalRepository,
  ServicoAdicionalCriarInput,
  ServicoAdicionalAtualizarInput,
} from "../repositories/servico-adicional.repository";

export class ServicoAdicionalNaoEncontradoError extends Error {
  constructor() {
    super("servico adicional nao encontrado");
    this.name = "ServicoAdicionalNaoEncontradoError";
  }
}

export class ServicoAdicionalInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ServicoAdicionalInvalidoError";
  }
}

function validarDescricao(descricao: unknown): string {
  if (typeof descricao !== "string" || descricao.trim().length === 0) {
    throw new ServicoAdicionalInvalidoError("descricao e obrigatoria");
  }
  return descricao.trim();
}

function validarValorPadrao(valorPadrao: unknown): number {
  const valor = typeof valorPadrao === "string" ? Number(valorPadrao) : valorPadrao;
  if (typeof valor !== "number" || Number.isNaN(valor) || valor <= 0) {
    throw new ServicoAdicionalInvalidoError("valorPadrao deve ser um numero maior que zero");
  }
  return valor;
}

export function servicoAdicionalService(prisma: PrismaTenantClient) {
  const repository = servicoAdicionalRepository(prisma);

  async function criar(dados: ServicoAdicionalCriarInput) {
    const descricao = validarDescricao(dados.descricao);
    const valorPadrao = validarValorPadrao(dados.valorPadrao);
    return repository.criar({ ...dados, descricao, valorPadrao });
  }

  function listar() {
    return repository.listar();
  }

  async function buscarPorId(id: string) {
    const servico = await repository.buscarPorId(id);
    if (!servico) {
      throw new ServicoAdicionalNaoEncontradoError();
    }
    return servico;
  }

  async function atualizar(id: string, dados: ServicoAdicionalAtualizarInput) {
    await buscarPorId(id);

    const dadosValidados: ServicoAdicionalAtualizarInput = { ...dados };
    if (typeof dadosValidados.descricao === "string") {
      dadosValidados.descricao = validarDescricao(dadosValidados.descricao);
    }
    if (dadosValidados.valorPadrao !== undefined) {
      dadosValidados.valorPadrao = validarValorPadrao(dadosValidados.valorPadrao);
    }

    return repository.atualizar(id, dadosValidados);
  }

  async function remover(id: string) {
    await buscarPorId(id);
    return repository.remover(id);
  }

  return { criar, listar, buscarPorId, atualizar, remover };
}
