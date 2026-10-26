import { PrismaTenantClient } from "../lib/prisma-tenant";
import {
  maquinaRepository,
  MaquinaCriarInput,
  MaquinaAtualizarInput,
} from "../repositories/maquina.repository";

export class MaquinaNaoEncontradaError extends Error {
  constructor() {
    super("maquina nao encontrada");
    this.name = "MaquinaNaoEncontradaError";
  }
}

export class MaquinaInvalidaError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "MaquinaInvalidaError";
  }
}

function validarNome(nome: unknown): string {
  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new MaquinaInvalidaError("nome e obrigatorio");
  }
  return nome.trim();
}

function validarTipo(tipo: unknown): string {
  if (typeof tipo !== "string" || tipo.trim().length === 0) {
    throw new MaquinaInvalidaError("tipo e obrigatorio");
  }
  return tipo.trim();
}

export function maquinaService(prisma: PrismaTenantClient) {
  const repository = maquinaRepository(prisma);

  async function criar(dados: MaquinaCriarInput) {
    const nome = validarNome(dados.nome);
    const tipo = validarTipo(dados.tipo);
    return repository.criar({ ...dados, nome, tipo });
  }

  function listar() {
    return repository.listar();
  }

  async function buscarPorId(id: string) {
    const maquina = await repository.buscarPorId(id);
    if (!maquina) {
      throw new MaquinaNaoEncontradaError();
    }
    return maquina;
  }

  async function atualizar(id: string, dados: MaquinaAtualizarInput) {
    await buscarPorId(id);

    const dadosValidados: MaquinaAtualizarInput = { ...dados };
    if (typeof dadosValidados.nome === "string") {
      dadosValidados.nome = validarNome(dadosValidados.nome);
    }
    if (typeof dadosValidados.tipo === "string") {
      dadosValidados.tipo = validarTipo(dadosValidados.tipo);
    }

    return repository.atualizar(id, dadosValidados);
  }

  async function remover(id: string) {
    await buscarPorId(id);
    return repository.remover(id);
  }

  return { criar, listar, buscarPorId, atualizar, remover };
}
