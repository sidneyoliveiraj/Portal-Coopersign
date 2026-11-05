import { PrismaTenantClient } from "../lib/prisma-tenant";
import { usuarioRepository, UsuarioAtualizarInput } from "../repositories/usuario.repository";
import { hashSenha } from "./auth.service";

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("usuario nao encontrado");
    this.name = "UsuarioNaoEncontradoError";
  }
}

export class UsuarioInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "UsuarioInvalidoError";
  }
}

export class UsuarioSemPermissaoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "UsuarioSemPermissaoError";
  }
}

type Autor = { usuarioId: string; perfil: string };

const PERFIS_INTERNOS = ["ADMINISTRADOR", "GESTOR", "OPERADOR"] as const;
type PerfilInterno = (typeof PERFIS_INTERNOS)[number];

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new UsuarioInvalidoError(`${campo} e obrigatorio`);
  }
  return valor.trim();
}

function perfilValido(valor: unknown, autor: Autor): PerfilInterno {
  if (!PERFIS_INTERNOS.includes(valor as PerfilInterno)) {
    throw new UsuarioInvalidoError("perfil deve ser ADMINISTRADOR, GESTOR ou OPERADOR");
  }
  if (valor === "ADMINISTRADOR" && autor.perfil !== "ADMINISTRADOR") {
    throw new UsuarioSemPermissaoError("apenas administrador pode conceder perfil de administrador");
  }
  return valor as PerfilInterno;
}

export function usuarioService(prisma: PrismaTenantClient) {
  const repository = usuarioRepository(prisma);

  function listar() {
    return repository.listar();
  }

  async function criar(dados: Record<string, unknown>, autor: Autor) {
    const nome = texto(dados.nome, "nome");
    const email = texto(dados.email, "email");
    const senha = texto(dados.senha, "senha");
    if (senha.length < 6) {
      throw new UsuarioInvalidoError("senha deve ter pelo menos 6 caracteres");
    }
    const perfil = perfilValido(dados.perfil, autor);

    if (await repository.buscarPorEmail(email)) {
      throw new UsuarioInvalidoError("ja existe um usuario com este email");
    }

    return repository.criar({ nome, email, perfil, senhaHash: await hashSenha(senha) });
  }

  async function atualizar(id: string, dados: Record<string, unknown>, autor: Autor) {
    const usuario = await repository.buscarPorId(id);
    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }
    if (usuario.perfil === "ADMINISTRADOR" && autor.perfil !== "ADMINISTRADOR") {
      throw new UsuarioSemPermissaoError("apenas administrador pode alterar outro administrador");
    }

    const alteracoes: UsuarioAtualizarInput = {};
    if (dados.nome !== undefined) {
      alteracoes.nome = texto(dados.nome, "nome");
    }
    if (dados.perfil !== undefined && dados.perfil !== usuario.perfil) {
      alteracoes.perfil = perfilValido(dados.perfil, autor);
    }
    if (dados.ativo !== undefined) {
      if (typeof dados.ativo !== "boolean") {
        throw new UsuarioInvalidoError("ativo deve ser verdadeiro ou falso");
      }
      if (id === autor.usuarioId && !dados.ativo) {
        throw new UsuarioInvalidoError("voce nao pode desativar o proprio usuario");
      }
      alteracoes.ativo = dados.ativo;
    }

    return repository.atualizar(id, alteracoes);
  }

  return { listar, criar, atualizar };
}
