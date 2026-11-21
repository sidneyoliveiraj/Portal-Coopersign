import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { erroDaApi, simularApi } from "./testes/apiFalsa";
import { logado, renderizarApp } from "./testes/renderizar";

const indicadoresVazios = {
  receitaTotal: 0,
  receitaPorForma: { A_VISTA: 0, EM_CONTA: 0 },
  pedidosConcluidos: 0,
  pedidosPorMaquina: [],
  pedidosPorMaterial: [],
  taxaRetrabalho: null,
  tempoMedioHoras: null,
  custoRetrabalho: 0,
  retrabalhos: [],
  porMes: { meses: [], total: { pedidos: 0, metragem: 0, metragemCobrada: 0, receita: 0 } },
  pedidos: [],
};

describe("login (RF32) e página inicial de cada perfil (RF33, RFC 4.1)", () => {
  it("sem login, qualquer endereço leva para a tela de entrar", async () => {
    simularApi({});
    renderizarApp("/relatorios");

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("gestor entra e cai nos Relatórios", async () => {
    let entrou = false;
    const api = simularApi({
      "POST /auth/login": () => {
        entrou = true;
        return { token: "abc" };
      },
      "GET /auth/me": () =>
        entrou ? { usuario: { usuarioId: "u-1", organizacaoId: "org-1", perfil: "GESTOR" } } : erroDaApi(401, "sem token"),
      "GET /faturamento/indicadores": indicadoresVazios,
    });
    const usuario = renderizarApp("/login");

    await usuario.type(await screen.findByLabelText(/E-mail/), "gestor@coopersign.dev");
    await usuario.type(screen.getByLabelText(/Senha/), "senha123");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("heading", { name: "Relatórios" })).toBeInTheDocument();
    expect(api.chamadas("POST /auth/login")[0].corpo).toEqual({ email: "gestor@coopersign.dev", senha: "senha123" });
    expect(localStorage.getItem("coopersign.token")).toBe("abc");
  });

  it("senha errada mostra o aviso e não entra", async () => {
    simularApi({ "POST /auth/login": erroDaApi(401, "credenciais invalidas") });
    const usuario = renderizarApp("/login");

    await usuario.type(await screen.findByLabelText(/E-mail/), "gestor@coopersign.dev");
    await usuario.type(screen.getByLabelText(/Senha/), "errada");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail ou senha incorretos.")).toBeInTheDocument();
  });

  it("conta aguardando aprovação do gestor recebe outro aviso (RN14)", async () => {
    simularApi({ "POST /auth/login": erroDaApi(403, "conta inativa") });
    const usuario = renderizarApp("/login");

    await usuario.type(await screen.findByLabelText(/E-mail/), "cliente@exemplo.com");
    await usuario.type(screen.getByLabelText(/Senha/), "senha123");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText(/aguardando aprovação do gestor/)).toBeInTheDocument();
  });

  it("operador cai em Pedidos e não vê Relatórios nem cadastros no menu", async () => {
    simularApi({ ...logado("OPERADOR"), "GET /pedidos": { pedidos: [] }, "GET /clientes": { clientes: [] } });
    renderizarApp("/");

    expect(await screen.findByRole("heading", { name: "Pedidos" })).toBeInTheDocument();
    expect(screen.queryByText("Relatórios")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuários")).not.toBeInTheDocument();
  });

  it("operador que digita o endereço dos Relatórios volta para Pedidos", async () => {
    simularApi({ ...logado("OPERADOR"), "GET /pedidos": { pedidos: [] }, "GET /clientes": { clientes: [] } });
    renderizarApp("/relatorios");

    expect(await screen.findByRole("heading", { name: "Pedidos" })).toBeInTheDocument();
  });

  it("cliente cai em Meus pedidos (RF29)", async () => {
    simularApi({ ...logado("CLIENTE"), "GET /portal/pedidos": { pedidos: [] } });
    renderizarApp("/");

    expect(await screen.findByText("Nenhum pedido em andamento.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum pedido no histórico.")).toBeInTheDocument();
    expect(screen.queryByText("Novo pedido")).not.toBeInTheDocument();
  });

  it("sair apaga o token e volta para o login", async () => {
    simularApi({ ...logado("GESTOR"), "GET /faturamento/indicadores": indicadoresVazios });
    const usuario = renderizarApp("/");

    await usuario.click(await screen.findByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(localStorage.getItem("coopersign.token")).toBeNull();
  });
});
