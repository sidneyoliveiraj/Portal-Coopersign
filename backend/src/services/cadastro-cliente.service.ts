import { prisma } from "../lib/prisma";
import { hashSenha } from "./auth.service";

export class CadastroInvalidoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "CadastroInvalidoError";
  }
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new CadastroInvalidoError(`${campo} e obrigatorio`);
  }
  return valor.trim();
}

export async function cadastrarCliente(dados: Record<string, unknown>) {
  const nome = texto(dados.nome, "nome");
  const email = texto(dados.email, "email");
  const senha = texto(dados.senha, "senha");
  if (senha.length < 6) {
    throw new CadastroInvalidoError("senha deve ter pelo menos 6 caracteres");
  }

  const organizacaoId = process.env.ORGANIZACAO_CADASTRO_ID;
  const organizacao = organizacaoId ? await prisma.organizacao.findUnique({ where: { id: organizacaoId } }) : null;
  if (!organizacao) {
    throw new CadastroInvalidoError("cadastro publico indisponivel no momento");
  }

  const existente = await prisma.usuario.findFirst({ where: { organizacaoId: organizacao.id, email } });
  if (existente) {
    throw new CadastroInvalidoError("ja existe uma conta com este email");
  }

  const senhaHash = await hashSenha(senha);

  await prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.create({
      data: { organizacaoId: organizacao.id, nome, contato: email },
    });
    await tx.usuario.create({
      data: {
        organizacaoId: organizacao.id,
        nome,
        email,
        senhaHash,
        perfil: "CLIENTE",
        ativo: false,
        clienteId: cliente.id,
      },
    });
  });
}
