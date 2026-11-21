import { Prisma } from "../generated/prisma/client";
import { PrismaTenantClient } from "../lib/prisma-tenant";

export type UsuarioCriarInput = Omit<Prisma.UsuarioUncheckedCreateInput, "organizacaoId">;
export type UsuarioAtualizarInput = Pick<Prisma.UsuarioUncheckedUpdateInput, "nome" | "perfil" | "ativo">;

const dadosPublicos = { id: true, nome: true, email: true, perfil: true, ativo: true } as const;

export function usuarioRepository(prisma: PrismaTenantClient) {
  return {
    listar() {
      return prisma.usuario.findMany({
        where: { perfil: { not: "CLIENTE" } },
        select: dadosPublicos,
        orderBy: { nome: "asc" },
      });
    },

    listarContasClientes() {
      return prisma.usuario.findMany({
        where: { perfil: "CLIENTE" },
        select: { ...dadosPublicos, cliente: { select: { nome: true } } },
        orderBy: [{ ativo: "asc" }, { nome: "asc" }],
      });
    },

    buscarPorId(id: string) {
      return prisma.usuario.findUnique({ where: { id }, select: dadosPublicos });
    },

    buscarPorEmail(email: string) {
      return prisma.usuario.findFirst({ where: { email }, select: dadosPublicos });
    },

    criar(dados: UsuarioCriarInput) {
      return prisma.usuario.create({
        data: dados as Prisma.UsuarioUncheckedCreateInput,
        select: dadosPublicos,
      });
    },

    atualizar(id: string, dados: UsuarioAtualizarInput) {
      return prisma.usuario.update({ where: { id }, data: dados, select: dadosPublicos });
    },
  };
}
