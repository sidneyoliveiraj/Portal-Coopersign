import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashSenha } from "../src/services/auth.service";

// Roda a cada subida do container em producao. Cria a organizacao e o primeiro
// administrador so se ainda nao existirem; nunca troca a senha de quem ja existe.
// Diferente do seed.ts, nao cria dados de exemplo nem senha fixa.
async function main() {
  const organizacaoId = process.env.ORGANIZACAO_CADASTRO_ID;
  const nome = process.env.ORGANIZACAO_NOME;
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;

  if (!organizacaoId || !nome || !email || !senha) {
    throw new Error("defina ORGANIZACAO_CADASTRO_ID, ORGANIZACAO_NOME, ADMIN_EMAIL e ADMIN_SENHA");
  }
  if (senha.length < 12) {
    throw new Error("ADMIN_SENHA precisa ter pelo menos 12 caracteres");
  }

  await prisma.organizacao.upsert({
    where: { id: organizacaoId },
    update: {},
    create: { id: organizacaoId, nome },
  });

  const administradores = await prisma.usuario.count({ where: { organizacaoId, perfil: "ADMINISTRADOR" } });
  if (administradores === 0) {
    await prisma.usuario.create({
      data: { organizacaoId, nome: "Administrador", email, senhaHash: await hashSenha(senha), perfil: "ADMINISTRADOR" },
    });
    console.log(`administrador ${email} criado`);
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
