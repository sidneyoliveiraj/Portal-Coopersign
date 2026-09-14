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

  const outraOrganizacao = await prisma.organizacao.upsert({
    where: { id: "org-concorrente-dev" },
    update: {},
    create: { id: "org-concorrente-dev", nome: "Concorrente (dev)" },
  });

  await prisma.usuario.upsert({
    where: { email: "admin@concorrente.dev" },
    update: {},
    create: {
      organizacaoId: outraOrganizacao.id,
      nome: "Admin Concorrente",
      email: "admin@concorrente.dev",
      senhaHash,
      perfil: "ADMINISTRADOR",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "operador@coopersign.dev" },
    update: {},
    create: {
      organizacaoId: organizacao.id,
      nome: "Operador Dev",
      email: "operador@coopersign.dev",
      senhaHash,
      perfil: "OPERADOR",
    },
  });

  console.log("Usuario de teste pronto:", usuario.email);
  console.log("Usuario de outra organizacao (pra testar isolamento):", "admin@concorrente.dev");
  console.log("Usuario sem permissao de admin (pra testar RBAC):", "operador@coopersign.dev");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
