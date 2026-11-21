import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";

const falsos = vi.hoisted(() => ({
  pedido: {
    criar: vi.fn(),
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    listarPendentesValidacao: vi.fn(),
    aprovar: vi.fn(),
    rejeitar: vi.fn(),
    alterarFormaPagamento: vi.fn(),
    ajustarValor: vi.fn(),
  },
  fila: { listar: vi.fn(), atualizarStatus: vi.fn(), registrarRetrabalho: vi.fn(), mover: vi.fn() },
  faturamento: { contaAberta: vi.fn(), contasAbertas: vi.fn(), fecharConta: vi.fn(), indicadores: vi.fn() },
  portal: { listarPedidos: vi.fn(), buscarPedido: vi.fn() },
  usuario: {
    listar: vi.fn(),
    listarContasClientes: vi.fn(),
    criarContaCliente: vi.fn(),
    aprovarCliente: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    gerarLinkSenha: vi.fn(),
  },
  acesso: { consultarLink: vi.fn(), definirSenha: vi.fn(), pedirRecuperacao: vi.fn() },
  cadastrarCliente: vi.fn(),
}));

vi.mock("./lib/prisma", () => ({ prisma: { $extends: () => ({}) } }));
vi.mock("./services/pedido.service", async (original) => ({
  ...(await original<typeof import("./services/pedido.service")>()),
  pedidoService: () => falsos.pedido,
}));
vi.mock("./services/fila.service", () => ({ filaService: () => falsos.fila }));
vi.mock("./services/faturamento.service", async (original) => ({
  ...(await original<typeof import("./services/faturamento.service")>()),
  faturamentoService: () => falsos.faturamento,
}));
vi.mock("./services/portal.service", async (original) => ({
  ...(await original<typeof import("./services/portal.service")>()),
  portalService: () => falsos.portal,
}));
vi.mock("./services/usuario.service", async (original) => ({
  ...(await original<typeof import("./services/usuario.service")>()),
  usuarioService: () => falsos.usuario,
}));
vi.mock("./services/acesso.service", async (original) => ({
  ...(await original<typeof import("./services/acesso.service")>()),
  ...falsos.acesso,
}));
vi.mock("./services/cadastro-cliente.service", async (original) => ({
  ...(await original<typeof import("./services/cadastro-cliente.service")>()),
  cadastrarCliente: falsos.cadastrarCliente,
}));

import { app } from "./app";
import { gerarToken } from "./services/auth.service";
import { PedidoInvalidoError, PedidoNaoEncontradoError } from "./services/pedido.service";
import { MaquinaNaoEncontradaError } from "./services/maquina.service";
import { FaturamentoInvalidoError } from "./services/faturamento.service";
import { PedidoDoClienteNaoEncontradoError } from "./services/portal.service";
import {
  UsuarioInvalidoError,
  UsuarioNaoEncontradoError,
  UsuarioSemPermissaoError,
} from "./services/usuario.service";
import { AcessoInvalidoError } from "./services/acesso.service";
import { CadastroInvalidoError } from "./services/cadastro-cliente.service";

const gestor = () => `Bearer ${gerarToken({ usuarioId: "usu-1", organizacaoId: "org-1", perfil: "GESTOR" })}`;
const operador = () => `Bearer ${gerarToken({ usuarioId: "usu-2", organizacaoId: "org-1", perfil: "OPERADOR" })}`;
const cliente = () => `Bearer ${gerarToken({ usuarioId: "usu-3", organizacaoId: "org-1", perfil: "CLIENTE" })}`;

beforeAll(() => {
  process.env.JWT_SECRET = "segredo-teste";
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/pedidos (RF05, RF11 a RF15, RN07)", () => {
  it("lista pedidos e os pendentes de validacao", async () => {
    falsos.pedido.listar.mockResolvedValue([{ id: "ped-1" }]);
    falsos.pedido.listarPendentesValidacao.mockResolvedValue([]);

    const lista = await request(app).get("/api/pedidos").set("Authorization", operador());
    const pendentes = await request(app).get("/api/pedidos/validacao").set("Authorization", operador());

    expect(lista.status).toBe(200);
    expect(lista.body.pedidos).toHaveLength(1);
    expect(pendentes.status).toBe(200);
  });

  it("cria pedido (201) e responde 400 com dado invalido", async () => {
    falsos.pedido.criar.mockResolvedValueOnce({ id: "ped-1" });
    const ok = await request(app).post("/api/pedidos").set("Authorization", gestor()).send({ clienteId: "c" });
    expect(ok.status).toBe(201);

    falsos.pedido.criar.mockRejectedValueOnce(new PedidoInvalidoError("largura deve ser maior que zero"));
    const ruim = await request(app).post("/api/pedidos").set("Authorization", gestor()).send({});
    expect(ruim.status).toBe(400);
    expect(ruim.body.erro).toBe("largura deve ser maior que zero");
  });

  it("operador nao registra pedido nem muda forma de pagamento", async () => {
    const criar = await request(app).post("/api/pedidos").set("Authorization", operador()).send({});
    const pagamento = await request(app)
      .patch("/api/pedidos/ped-1/forma-pagamento")
      .set("Authorization", operador())
      .send({ formaPagamento: "EM_CONTA" });

    expect(criar.status).toBe(403);
    expect(pagamento.status).toBe(403);
    expect(falsos.pedido.criar).not.toHaveBeenCalled();
  });

  it("busca pedido: 200 e 404", async () => {
    falsos.pedido.buscarPorId.mockResolvedValueOnce({ id: "ped-1" });
    const achou = await request(app).get("/api/pedidos/ped-1").set("Authorization", operador());
    expect(achou.status).toBe(200);

    falsos.pedido.buscarPorId.mockRejectedValueOnce(new PedidoNaoEncontradoError());
    const naoAchou = await request(app).get("/api/pedidos/outro").set("Authorization", operador());
    expect(naoAchou.status).toBe(404);
  });

  it.each([
    ["post", "/api/pedidos/ped-1/aprovar", "aprovar"],
    ["post", "/api/pedidos/ped-1/rejeitar", "rejeitar"],
    ["patch", "/api/pedidos/ped-1/forma-pagamento", "alterarFormaPagamento"],
    ["post", "/api/pedidos/ped-1/ajustes", "ajustarValor"],
  ] as const)("%s %s responde 200, 400 e 404", async (metodo, rota, acao) => {
    const servico = falsos.pedido[acao];

    servico.mockResolvedValueOnce({ id: "ped-1" });
    const ok = await request(app)[metodo](rota).set("Authorization", gestor()).send({ justificativa: "x" });
    expect(ok.status).toBe(200);
    expect(servico.mock.calls[0][0]).toBe("ped-1");

    servico.mockRejectedValueOnce(new PedidoInvalidoError("justificativa e obrigatoria"));
    const ruim = await request(app)[metodo](rota).set("Authorization", gestor()).send({});
    expect(ruim.status).toBe(400);

    servico.mockRejectedValueOnce(new PedidoNaoEncontradoError());
    const sumiu = await request(app)[metodo](rota).set("Authorization", gestor()).send({});
    expect(sumiu.status).toBe(404);
  });
});

describe("/api/fila (RF16 a RF23)", () => {
  it("lista a fila da maquina e responde 404 se a maquina nao existe", async () => {
    falsos.fila.listar.mockResolvedValueOnce({ fila: [], concluidos: [] });
    const ok = await request(app).get("/api/fila/maquinas/maq-1").set("Authorization", operador());
    expect(ok.status).toBe(200);
    expect(falsos.fila.listar).toHaveBeenCalledWith("maq-1");

    falsos.fila.listar.mockRejectedValueOnce(new MaquinaNaoEncontradaError());
    const sumiu = await request(app).get("/api/fila/maquinas/outra").set("Authorization", operador());
    expect(sumiu.status).toBe(404);
  });

  it("atualiza status (200) e recusa transicao invalida (400)", async () => {
    falsos.fila.atualizarStatus.mockResolvedValueOnce({ id: "ped-1", status: "EM_PRODUCAO" });
    const ok = await request(app)
      .post("/api/fila/pedidos/ped-1/status")
      .set("Authorization", operador())
      .send({ status: "EM_PRODUCAO" });
    expect(ok.status).toBe(200);

    falsos.fila.atualizarStatus.mockRejectedValueOnce(new PedidoInvalidoError("transicao invalida"));
    const ruim = await request(app)
      .post("/api/fila/pedidos/ped-1/status")
      .set("Authorization", operador())
      .send({ status: "FATURADO" });
    expect(ruim.status).toBe(400);
  });

  it("registra retrabalho (201) e responde 404 para pedido inexistente", async () => {
    falsos.fila.registrarRetrabalho.mockResolvedValueOnce({ id: "ped-1" });
    const ok = await request(app)
      .post("/api/fila/pedidos/ped-1/retrabalho")
      .set("Authorization", operador())
      .send({ motivo: "cor errada", custoOperacional: 29 });
    expect(ok.status).toBe(201);

    falsos.fila.registrarRetrabalho.mockRejectedValueOnce(new PedidoNaoEncontradoError());
    const sumiu = await request(app).post("/api/fila/pedidos/outro/retrabalho").set("Authorization", operador());
    expect(sumiu.status).toBe(404);
  });

  it("so gestor reposiciona na fila (RF23)", async () => {
    const negado = await request(app)
      .post("/api/fila/pedidos/ped-1/mover")
      .set("Authorization", operador())
      .send({ posicao: 1 });
    expect(negado.status).toBe(403);

    falsos.fila.mover.mockResolvedValueOnce({ id: "ped-1" });
    const ok = await request(app).post("/api/fila/pedidos/ped-1/mover").set("Authorization", gestor()).send({ posicao: 1 });
    expect(ok.status).toBe(200);
  });

  it("erro inesperado na fila responde 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    falsos.fila.mover.mockRejectedValueOnce(new Error("falha"));

    const resposta = await request(app).post("/api/fila/pedidos/ped-1/mover").set("Authorization", gestor());

    expect(resposta.status).toBe(500);
  });
});

describe("/api/faturamento (RF24 a RF28)", () => {
  it("operador nao acessa faturamento", async () => {
    const resposta = await request(app).get("/api/faturamento/indicadores").set("Authorization", operador());

    expect(resposta.status).toBe(403);
  });

  it.each([
    ["get", "/api/faturamento/conta?clienteId=c&inicio=2026-11-01&fim=2026-11-30", "contaAberta"],
    ["get", "/api/faturamento/contas?inicio=2026-11-01&fim=2026-11-30", "contasAbertas"],
    ["post", "/api/faturamento/conta/fechar", "fecharConta"],
    ["get", "/api/faturamento/indicadores?inicio=2026-01-01&fim=2026-11-30", "indicadores"],
  ] as const)("%s %s responde 200 e 400", async (metodo, rota, acao) => {
    const servico = falsos.faturamento[acao];

    servico.mockResolvedValueOnce({ total: 238.06 });
    const ok = await request(app)[metodo](rota).set("Authorization", gestor());
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ total: 238.06 });

    servico.mockRejectedValueOnce(new FaturamentoInvalidoError("periodo invalido"));
    const ruim = await request(app)[metodo](rota).set("Authorization", gestor());
    expect(ruim.status).toBe(400);
  });

  it("erro inesperado no faturamento responde 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    falsos.faturamento.indicadores.mockRejectedValueOnce(new Error("falha"));

    const resposta = await request(app).get("/api/faturamento/indicadores").set("Authorization", gestor());

    expect(resposta.status).toBe(500);
  });
});

describe("/api/portal (RF29 a RF31, RN10)", () => {
  it("so o perfil cliente entra no portal", async () => {
    const resposta = await request(app).get("/api/portal/pedidos").set("Authorization", gestor());

    expect(resposta.status).toBe(403);
  });

  it("cliente lista os proprios pedidos e nao ve pedido de outro (404)", async () => {
    falsos.portal.listarPedidos.mockResolvedValueOnce([{ id: "ped-1" }]);
    const lista = await request(app).get("/api/portal/pedidos").set("Authorization", cliente());
    expect(lista.status).toBe(200);
    expect(lista.body.pedidos).toHaveLength(1);

    falsos.portal.buscarPedido.mockResolvedValueOnce({ id: "ped-1" });
    const meu = await request(app).get("/api/portal/pedidos/ped-1").set("Authorization", cliente());
    expect(meu.status).toBe(200);

    falsos.portal.buscarPedido.mockRejectedValueOnce(new PedidoDoClienteNaoEncontradoError());
    const deOutro = await request(app).get("/api/portal/pedidos/ped-9").set("Authorization", cliente());
    expect(deOutro.status).toBe(404);
  });
});

describe("/api/usuarios (RF34, RF35, RF37)", () => {
  it("operador nao gerencia usuarios", async () => {
    const resposta = await request(app).get("/api/usuarios").set("Authorization", operador());

    expect(resposta.status).toBe(403);
  });

  it("lista usuarios e contas de clientes", async () => {
    falsos.usuario.listar.mockResolvedValueOnce([{ id: "usu-1" }]);
    falsos.usuario.listarContasClientes.mockResolvedValueOnce([]);

    const usuarios = await request(app).get("/api/usuarios").set("Authorization", gestor());
    const contas = await request(app).get("/api/usuarios/clientes").set("Authorization", gestor());

    expect(usuarios.body.usuarios).toHaveLength(1);
    expect(contas.status).toBe(200);
  });

  it("cria conta de cliente por convite e devolve o token do link", async () => {
    falsos.usuario.criarContaCliente.mockResolvedValueOnce({ usuario: { id: "usu-9" }, tokenConvite: "tok" });

    const resposta = await request(app)
      .post("/api/usuarios/clientes")
      .set("Authorization", gestor())
      .send({ clienteId: "cli-1", email: "c@x.dev" });

    expect(resposta.status).toBe(201);
    expect(resposta.body.tokenConvite).toBe("tok");
  });

  it("cria usuario passando quem esta logado para a regra de permissao", async () => {
    falsos.usuario.criar.mockResolvedValueOnce({ id: "usu-9" });

    const resposta = await request(app).post("/api/usuarios").set("Authorization", gestor()).send({ nome: "Ana" });

    expect(resposta.status).toBe(201);
    expect(falsos.usuario.criar.mock.calls[0][1]).toMatchObject({ usuarioId: "usu-1", perfil: "GESTOR" });
  });

  it("aprova cliente, atualiza usuario e gera link de senha", async () => {
    falsos.usuario.aprovarCliente.mockResolvedValueOnce({ id: "usu-9", ativo: true });
    falsos.usuario.atualizar.mockResolvedValueOnce({ id: "usu-9" });
    falsos.usuario.gerarLinkSenha.mockResolvedValueOnce("tok");

    const aprovar = await request(app).post("/api/usuarios/usu-9/aprovar").set("Authorization", gestor());
    const atualizar = await request(app).put("/api/usuarios/usu-9").set("Authorization", gestor()).send({ nome: "B" });
    const link = await request(app).post("/api/usuarios/usu-9/link-senha").set("Authorization", gestor());

    expect(aprovar.status).toBe(200);
    expect(atualizar.status).toBe(200);
    expect(link.status).toBe(201);
    expect(link.body.token).toBe("tok");
  });

  it.each([
    [new UsuarioInvalidoError("email invalido"), 400],
    [new UsuarioSemPermissaoError("gestor nao altera administrador"), 403],
    [new UsuarioNaoEncontradoError(), 404],
  ])("erro %s vira status %i", async (erro, status) => {
    falsos.usuario.atualizar.mockRejectedValueOnce(erro);
    falsos.usuario.criar.mockRejectedValueOnce(erro);
    falsos.usuario.aprovarCliente.mockRejectedValueOnce(erro);
    falsos.usuario.criarContaCliente.mockRejectedValueOnce(erro);
    falsos.usuario.gerarLinkSenha.mockRejectedValueOnce(erro);

    const respostas = await Promise.all([
      request(app).put("/api/usuarios/usu-9").set("Authorization", gestor()).send({}),
      request(app).post("/api/usuarios").set("Authorization", gestor()).send({}),
      request(app).post("/api/usuarios/usu-9/aprovar").set("Authorization", gestor()),
      request(app).post("/api/usuarios/clientes").set("Authorization", gestor()).send({}),
      request(app).post("/api/usuarios/usu-9/link-senha").set("Authorization", gestor()),
    ]);

    expect(respostas.map((resposta) => resposta.status)).toEqual([status, status, status, status, status]);
  });

  it("erro inesperado em usuarios responde 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    falsos.usuario.criar.mockRejectedValueOnce(new Error("falha"));

    const resposta = await request(app).post("/api/usuarios").set("Authorization", gestor()).send({});

    expect(resposta.status).toBe(500);
  });
});

describe("/api/auth: cadastro publico, sessao e links de senha (RF32, RF35, RF36)", () => {
  it("/me devolve o usuario do token", async () => {
    const resposta = await request(app).get("/api/auth/me").set("Authorization", gestor());

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({ usuarioId: "usu-1", organizacaoId: "org-1", perfil: "GESTOR" });
  });

  it("cadastro publico: 201 e 400", async () => {
    falsos.cadastrarCliente.mockResolvedValueOnce(undefined);
    const ok = await request(app).post("/api/auth/cadastro").send({ nome: "Oficina" });
    expect(ok.status).toBe(201);

    falsos.cadastrarCliente.mockRejectedValueOnce(new CadastroInvalidoError("senha curta"));
    const ruim = await request(app).post("/api/auth/cadastro").send({});
    expect(ruim.status).toBe(400);
  });

  it("consulta o link de senha: 200 e 400 com link vencido", async () => {
    falsos.acesso.consultarLink.mockResolvedValueOnce({ nome: "Ana", email: "a@x.dev" });
    const ok = await request(app).get("/api/auth/link-senha?token=abc");
    expect(ok.status).toBe(200);
    expect(falsos.acesso.consultarLink).toHaveBeenCalledWith("abc");

    falsos.acesso.consultarLink.mockRejectedValueOnce(new AcessoInvalidoError("link invalido ou expirado"));
    const vencido = await request(app).get("/api/auth/link-senha?token=velho");
    expect(vencido.status).toBe(400);
  });

  it("define a senha: 200 e 400", async () => {
    falsos.acesso.definirSenha.mockResolvedValueOnce(undefined);
    const ok = await request(app).post("/api/auth/definir-senha").send({ token: "abc", senha: "nova123" });
    expect(ok.status).toBe(200);

    falsos.acesso.definirSenha.mockRejectedValueOnce(new AcessoInvalidoError("senha curta"));
    const ruim = await request(app).post("/api/auth/definir-senha").send({ token: "abc", senha: "1" });
    expect(ruim.status).toBe(400);
  });

  it("esqueci a senha responde igual, sem revelar quem tem conta", async () => {
    falsos.acesso.pedirRecuperacao.mockResolvedValueOnce(undefined);
    const ok = await request(app).post("/api/auth/esqueci-senha").send({ email: "ninguem@x.dev" });
    expect(ok.status).toBe(200);
    expect(ok.body.mensagem).toBe("se o e-mail estiver cadastrado, o link foi enviado");

    falsos.acesso.pedirRecuperacao.mockRejectedValueOnce(new AcessoInvalidoError("email e obrigatorio"));
    const ruim = await request(app).post("/api/auth/esqueci-senha").send({});
    expect(ruim.status).toBe(400);
  });

  it("erro inesperado no acesso responde 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    falsos.acesso.definirSenha.mockRejectedValueOnce(new Error("falha"));
    falsos.cadastrarCliente.mockRejectedValueOnce(new Error("falha"));

    const definir = await request(app).post("/api/auth/definir-senha").send({});
    const cadastro = await request(app).post("/api/auth/cadastro").send({});

    expect(definir.status).toBe(500);
    expect(cadastro.status).toBe(500);
  });
});
