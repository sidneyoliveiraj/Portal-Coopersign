import { PrismaTenantClient } from "../lib/prisma-tenant";
import {
  materialRepository,
  MaterialCriarInput,
  MaterialAtualizarInput,
} from "../repositories/material.repository";

export class MaterialNaoEncontradoError extends Error {
  constructor() {
    super("material nao encontrado");
    this.name = "MaterialNaoEncontradoError";
  }
}

export class MaterialInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "MaterialInvalidoError";
  }
}

function validarTipo(tipo: unknown): string {
  if (typeof tipo !== "string" || tipo.trim().length === 0) {
    throw new MaterialInvalidoError("tipo e obrigatorio");
  }
  return tipo.trim();
}

function validarPrecoM2(precoM2: unknown): number {
  const valor = typeof precoM2 === "string" ? Number(precoM2) : precoM2;
  if (typeof valor !== "number" || Number.isNaN(valor) || valor <= 0) {
    throw new MaterialInvalidoError("precoM2 deve ser um numero maior que zero");
  }
  return valor;
}

export function materialService(prisma: PrismaTenantClient) {
  const repository = materialRepository(prisma);

  async function criar(dados: MaterialCriarInput) {
    const tipo = validarTipo(dados.tipo);
    const precoM2 = validarPrecoM2(dados.precoM2);
    return repository.criar({ ...dados, tipo, precoM2 });
  }

  function listar() {
    return repository.listar();
  }

  async function buscarPorId(id: string) {
    const material = await repository.buscarPorId(id);
    if (!material) {
      throw new MaterialNaoEncontradoError();
    }
    return material;
  }

  async function atualizar(id: string, dados: MaterialAtualizarInput) {
    await buscarPorId(id);

    const dadosValidados: MaterialAtualizarInput = { ...dados };
    if (typeof dadosValidados.tipo === "string") {
      dadosValidados.tipo = validarTipo(dadosValidados.tipo);
    }
    if (dadosValidados.precoM2 !== undefined) {
      dadosValidados.precoM2 = validarPrecoM2(dadosValidados.precoM2);
    }

    return repository.atualizar(id, dadosValidados);
  }

  async function remover(id: string) {
    await buscarPorId(id);
    return repository.remover(id);
  }

  return { criar, listar, buscarPorId, atualizar, remover };
}
