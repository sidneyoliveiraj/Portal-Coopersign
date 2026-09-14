import { PrismaTenantClient } from "../lib/prisma-tenant";
import {
  clienteRepository,
  ClienteCriarInput,
  ClienteAtualizarInput,
} from "../repositories/cliente.repository";

export class ClienteNaoEncontradoError extends Error {
  constructor() {
    super("cliente nao encontrado");
    this.name = "ClienteNaoEncontradoError";
  }
}

export class ClienteInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ClienteInvalidoError";
  }
}

function validarNome(nome: unknown): string {
  if (typeof nome !== "string" || nome.trim().length === 0) {
    throw new ClienteInvalidoError("nome e obrigatorio");
  }
  return nome.trim();
}

export function clienteService(prisma: PrismaTenantClient) {
  const repository = clienteRepository(prisma);

  async function criar(dados: ClienteCriarInput) {
    const nome = validarNome(dados.nome);
    return repository.criar({ ...dados, nome });
  }

  function listar() {
    return repository.listar();
  }

  async function buscarPorId(id: string) {
    const cliente = await repository.buscarPorId(id);
    if (!cliente) {
      throw new ClienteNaoEncontradoError();
    }
    return cliente;
  }

  async function atualizar(id: string, dados: ClienteAtualizarInput) {
    await buscarPorId(id);

    const dadosValidados: ClienteAtualizarInput = { ...dados };
    if (typeof dadosValidados.nome === "string") {
      dadosValidados.nome = validarNome(dadosValidados.nome);
    }

    return repository.atualizar(id, dadosValidados);
  }

  async function remover(id: string) {
    await buscarPorId(id);
    return repository.remover(id);
  }

  return { criar, listar, buscarPorId, atualizar, remover };
}
