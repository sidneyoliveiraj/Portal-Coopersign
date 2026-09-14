import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashSenha } from "../src/services/auth.service";

async function main() {
  const organizacao = await prisma.organizacao.upsert({
    where: { id: "org-coopersign-dev" },
    update: {},
    create: { id: "org-coopersign-dev", nome: "Coopersign (dev)" },
  });

  const senhaHash = await hashSenha("senha123");

  const usuario = await prisma.usuario.upsert({
    where: { email: "admin@coopersign.dev" },
    update: {},
    create: {
      organizacaoId: organizacao.id,
      nome: "Admin Dev",
      email: "admin@coopersign.dev",
      senhaHash,
      perfil: "ADMINISTRADOR",
    },
  });

  console.log("Usuario de teste pronto:", usuario.email);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
