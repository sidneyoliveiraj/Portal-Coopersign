import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";

// Banco falso: cada modelo tem os metodos do Prisma como vi.fn().
// O $extends aplica a extensao real do prisma-tenant, entao a injecao do
// organizacaoId (RN15) passa pelo codigo de verdade.
const { bancoFalso } = vi.hoisted(() => {
  const modelo = () => ({
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });
  return {
    bancoFalso: {
      cliente: modelo(),
      maquina: modelo(),
      material: modelo(),
      servicoAdicional: modelo(),
    } as Record<string, Record<string, ReturnType<typeof vi.fn>>>,
  };
});

vi.mock("./lib/prisma", () => ({
  prisma: {
    $extends(extensao: {
      query: { $allModels: { $allOperations: (params: Record<string, unknown>) => Promise<unknown> } };
    }) {
      const interceptar = extensao.query.$allModels.$allOperations;
      const cliente: Record<string, Record<string, (args: unknown) => Promise<unknown>>> = {};
      for (const [nome, metodos] of Object.entries(bancoFalso)) {
        const model = nome[0].toUpperCase() + nome.slice(1);
        cliente[nome] = {};
        for (const [operation, metodo] of Object.entries(metodos)) {
          cliente[nome][operation] = (args) => interceptar({ model, operation, args, query: metodo });
        }
      }
      return cliente;
    },
  },
}));

import { app } from "./app";
import { gerarToken } from "./services/auth.service";

function token(perfil: string, organizacaoId = "org-1") {
  return `Bearer ${gerarToken({ usuarioId: "usu-1", organizacaoId, perfil })}`;
}

const cadastros = [
  {
    rota: "/api/clientes",
    modelo: "cliente",
    um: "cliente",
    varios: "clientes",
    valido: { nome: "Charles" },
    invalido: { nome: "" },
  },
  {
    rota: "/api/maquinas",
    modelo: "maquina",
    um: "maquina",
    varios: "maquinas",
    valido: { nome: "Plotter", tipo: "impressao" },
    invalido: { nome: "Plotter", tipo: "" },
  },
  {
    rota: "/api/materiais",
    modelo: "material",
    um: "material",
    varios: "materiais",
    valido: { tipo: "Lona", precoM2: 29 },
    invalido: { tipo: "Lona", precoM2: 0 },
  },
  {
    rota: "/api/servicos-adicionais",
    modelo: "servicoAdicional",
    um: "servicoAdicional",
    varios: "servicosAdicionais",
    valido: { descricao: "Ilhos", valorPadrao: 5 },
    invalido: { descricao: "", valorPadrao: 5 },
  },
];

beforeAll(() => {
  process.env.JWT_SECRET = "segredo-teste";
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("responde OK sem login", async () => {
    const resposta = await request(app).get("/api/health");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: "OK" });
  });
});

describe.each(cadastros)("$rota (RF01 a RF04 por HTTP)", ({ rota, modelo, um, varios, valido, invalido }) => {
  const banco = () => bancoFalso[modelo];

  beforeEach(() => {
    banco().findUnique.mockResolvedValue({ id: "id-1", ...valido });
    banco().findMany.mockResolvedValue([{ id: "id-1", ...valido }]);
    banco().create.mockImplementation(({ data }) => Promise.resolve({ id: "id-novo", ...data }));
    banco().update.mockImplementation(({ data }) => Promise.resolve({ id: "id-1", ...data }));
    banco().delete.mockResolvedValue({ id: "id-1" });
  });

  it("sem token responde 401", async () => {
    const resposta = await request(app).get(rota);

    expect(resposta.status).toBe(401);
    expect(banco().findMany).not.toHaveBeenCalled();
  });

  it("token adulterado responde 401", async () => {
    const resposta = await request(app).get(rota).set("Authorization", "Bearer abc.def.ghi");

    expect(resposta.status).toBe(401);
  });

  it("cliente nao acessa o cadastro (403)", async () => {
    const resposta = await request(app).get(rota).set("Authorization", token("CLIENTE"));

    expect(resposta.status).toBe(403);
  });

  it("operador lista, filtrando pela organizacao do token (RN15)", async () => {
    const resposta = await request(app).get(rota).set("Authorization", token("OPERADOR", "org-7"));

    expect(resposta.status).toBe(200);
    expect(resposta.body[varios]).toHaveLength(1);
    expect(banco().findMany.mock.calls[0][0].where).toEqual({ organizacaoId: "org-7" });
  });

  it("operador nao cria (403)", async () => {
    const resposta = await request(app).post(rota).set("Authorization", token("OPERADOR")).send(valido);

    expect(resposta.status).toBe(403);
    expect(banco().create).not.toHaveBeenCalled();
  });

  it("gestor cria com a organizacao do token, mesmo se o corpo mandar outra", async () => {
    const resposta = await request(app)
      .post(rota)
      .set("Authorization", token("GESTOR", "org-1"))
      .send({ ...valido, organizacaoId: "org-intrusa" });

    expect(resposta.status).toBe(201);
    expect(resposta.body[um].organizacaoId).toBe("org-1");
  });

  it("dados invalidos respondem 400", async () => {
    const resposta = await request(app).post(rota).set("Authorization", token("GESTOR")).send(invalido);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBeTruthy();
  });

  it("busca por id: 200 e 404", async () => {
    const achou = await request(app).get(`${rota}/id-1`).set("Authorization", token("OPERADOR"));
    expect(achou.status).toBe(200);
    expect(achou.body[um].id).toBe("id-1");
    expect(banco().findUnique.mock.calls[0][0].where).toEqual({ id: "id-1", organizacaoId: "org-1" });

    banco().findUnique.mockResolvedValue(null);
    const naoAchou = await request(app).get(`${rota}/outro`).set("Authorization", token("OPERADOR"));
    expect(naoAchou.status).toBe(404);
  });

  it("atualiza: 200, 400 e 404, sem deixar trocar a organizacao", async () => {
    const ok = await request(app)
      .put(`${rota}/id-1`)
      .set("Authorization", token("ADMINISTRADOR"))
      .send({ ...valido, organizacaoId: "org-intrusa" });
    expect(ok.status).toBe(200);
    expect(banco().update.mock.calls[0][0].data.organizacaoId).toBeUndefined();

    const ruim = await request(app).put(`${rota}/id-1`).set("Authorization", token("GESTOR")).send(invalido);
    expect(ruim.status).toBe(400);

    banco().findUnique.mockResolvedValue(null);
    const sumiu = await request(app).put(`${rota}/outro`).set("Authorization", token("GESTOR")).send(valido);
    expect(sumiu.status).toBe(404);
  });

  it("remove: 204 e 404", async () => {
    const ok = await request(app).delete(`${rota}/id-1`).set("Authorization", token("GESTOR"));
    expect(ok.status).toBe(204);

    banco().findUnique.mockResolvedValue(null);
    const sumiu = await request(app).delete(`${rota}/outro`).set("Authorization", token("GESTOR"));
    expect(sumiu.status).toBe(404);
  });
});

describe("tratamento de erros do banco (app.ts)", () => {
  beforeEach(() => {
    bancoFalso.cliente.findUnique.mockResolvedValue({ id: "cli-1", nome: "Charles" });
  });

  it("registro em uso por um pedido nao pode ser removido (409)", async () => {
    bancoFalso.cliente.delete.mockRejectedValue({ code: "P2003" });

    const resposta = await request(app).delete("/api/clientes/cli-1").set("Authorization", token("GESTOR"));

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe("registro em uso, nao pode ser removido");
  });

  it("registro duplicado responde 409", async () => {
    bancoFalso.cliente.create.mockRejectedValue({ code: "P2002" });

    const resposta = await request(app)
      .post("/api/clientes")
      .set("Authorization", token("GESTOR"))
      .send({ nome: "Charles" });

    expect(resposta.status).toBe(409);
  });

  it("erro inesperado responde 500 sem mostrar detalhes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    bancoFalso.cliente.findMany.mockRejectedValue(new Error("conexao caiu"));

    const resposta = await request(app).get("/api/clientes").set("Authorization", token("GESTOR"));

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ erro: "erro interno do servidor" });
  });
});
