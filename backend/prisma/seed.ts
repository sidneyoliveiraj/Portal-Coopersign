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
    where: { organizacaoId_email: { organizacaoId: organizacao.id, email: "admin@coopersign.dev" } },
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
    where: { organizacaoId_email: { organizacaoId: outraOrganizacao.id, email: "admin@concorrente.dev" } },
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
    where: { organizacaoId_email: { organizacaoId: organizacao.id, email: "operador@coopersign.dev" } },
    update: {},
    create: {
      organizacaoId: organizacao.id,
      nome: "Operador Dev",
      email: "operador@coopersign.dev",
      senhaHash,
      perfil: "OPERADOR",
    },
  });

  const clientes = ["Padaria Pão Dourado", "Auto Center Rota 280", "Clínica Sorriso", "Escola Pequeno Saber"];
  for (const [indice, nome] of clientes.entries()) {
    const id = `cli-dev-${indice + 1}`;
    await prisma.cliente.upsert({
      where: { id },
      update: { nome },
      create: { id, organizacaoId: organizacao.id, nome },
    });
  }

  const materiais = [
    { tipo: "Lona 440g", precoM2: 45.5 },
    { tipo: "Adesivo vinil branco", precoM2: 38 },
    { tipo: "Adesivo perfurado", precoM2: 52 },
    { tipo: "Lona backlight", precoM2: 62.9 },
  ];
  for (const [indice, material] of materiais.entries()) {
    const id = `mat-dev-${indice + 1}`;
    await prisma.material.upsert({
      where: { id },
      update: material,
      create: { id, organizacaoId: organizacao.id, ...material },
    });
  }

  const maquinas = [
    { nome: "Plotter Roland", tipo: "impressao", status: "ATIVA" as const },
    { nome: "Recorte Graphtec", tipo: "recorte", status: "ATIVA" as const },
    { nome: "Plotter Mimaki", tipo: "impressao", status: "EM_MANUTENCAO" as const },
  ];
  for (const [indice, maquina] of maquinas.entries()) {
    const id = `maq-dev-${indice + 1}`;
    await prisma.maquina.upsert({
      where: { id },
      update: maquina,
      create: { id, organizacaoId: organizacao.id, ...maquina },
    });
  }

  const servicos = [
    { descricao: "Ilhós", valorPadrao: 1.5 },
    { descricao: "Solda de bainha", valorPadrao: 8 },
    { descricao: "Instalação", valorPadrao: 120 },
  ];
  for (const [indice, servico] of servicos.entries()) {
    const id = `srv-dev-${indice + 1}`;
    await prisma.servicoAdicional.upsert({
      where: { id },
      update: servico,
      create: { id, organizacaoId: organizacao.id, ...servico },
    });
  }

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
