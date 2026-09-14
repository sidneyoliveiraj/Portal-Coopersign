import { prisma } from "./prisma";

const MODELOS_MULTI_TENANT = new Set([
  "Usuario",
  "Cliente",
  "Maquina",
  "Material",
  "ServicoAdicional",
  "Pedido",
]);

const OPERACOES_COM_WHERE = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
];

/**
 * Cliente Prisma "preso" a uma organizacao: RN15 exige que cada usuario e
 * registro pertenca a uma unica organizacao, sem cruzar dados entre elas.
 * Em vez de cada repository lembrar de filtrar por organizacaoId na mao,
 * esse extends injeta o filtro automaticamente em toda query dos modelos
 * multi-tenant.
 */
export function prismaTenant(organizacaoId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !MODELOS_MULTI_TENANT.has(model)) {
            return query(args);
          }

          const argsComTenant = args as { where?: Record<string, unknown>; data?: Record<string, unknown> };

          if (OPERACOES_COM_WHERE.includes(operation)) {
            argsComTenant.where = { ...argsComTenant.where, organizacaoId };
          }

          if (operation === "create") {
            argsComTenant.data = { ...argsComTenant.data, organizacaoId };
          }

          return query(argsComTenant);
        },
      },
    },
  });
}

export type PrismaTenantClient = ReturnType<typeof prismaTenant>;
