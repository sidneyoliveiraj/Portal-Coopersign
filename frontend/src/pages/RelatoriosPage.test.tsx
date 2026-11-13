import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { simularApi } from "../testes/apiFalsa";
import { logado, renderizarApp } from "../testes/renderizar";
import { hojeIso } from "../formato";

const indicadores = {
  receitaTotal: 145,
  receitaPorForma: { A_VISTA: 29, EM_CONTA: 116 },
  pedidosConcluidos: 2,
  pedidosPorMaquina: [{ maquina: "Firejet", quantidade: 2 }],
  pedidosPorMaterial: [{ material: "Adesivo brilho 106", quantidade: 2, metragem: 4.49 }],
  taxaRetrabalho: 50,
  tempoMedioHoras: 1.5,
  custoRetrabalho: 29,
  retrabalhos: [
    {
      id: "r-1",
      pedidoId: "p-1",
      data: "2026-03-06T12:00:00.000Z",
      cliente: "Gráfica Aurora",
      material: "Adesivo brilho 106",
      motivo: "cor errada",
      custo: 29,
    },
  ],
  porMes: {
    meses: [
      { mes: "2026-01", pedidos: 1, metragem: 0.97, metragemCobrada: 1, receita: 29 },
      { mes: "2026-02", pedidos: 0, metragem: 0, metragemCobrada: 0, receita: 0 },
      { mes: "2026-03", pedidos: 1, metragem: 3.52, metragemCobrada: 4, receita: 116 },
    ],
    total: { pedidos: 2, metragem: 4.49, metragemCobrada: 5, receita: 145 },
  },
  pedidos: [],
};

const semNbsp = (texto: string | null) => (texto ?? "").replace(/\s/g, " ");

describe("Relatórios (RF25, RF28)", () => {
  it("mostra a tabela mês a mês com o total do período", async () => {
    simularApi({ ...logado("GESTOR"), "GET /faturamento/indicadores": indicadores });
    renderizarApp("/relatorios");

    const tabela = (await screen.findByText("Mês a mês")).closest("div")!;
    const linhas = within(tabela).getAllByRole("row").map((linha) => semNbsp(linha.textContent));

    expect(linhas).toContain("Janeiro/202610,97 m²1,00 m²R$ 29,00");
    expect(linhas).toContain("Fevereiro/202600,00 m²0,00 m²R$ 0,00");
    expect(linhas).toContain("Total do período24,49 m²5,00 m²R$ 145,00");
  });

  it("mostra os indicadores do painel e a divisão por forma de pagamento", async () => {
    simularApi({ ...logado("GESTOR"), "GET /faturamento/indicadores": indicadores });
    renderizarApp("/relatorios");

    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1,5 h")).toBeInTheDocument();
    expect(screen.getByText("À vista · 20%")).toBeInTheDocument();
    expect(screen.getByText("Em conta · 80%")).toBeInTheDocument();
    expect(screen.getByText("cor errada")).toBeInTheDocument();
  });

  it("os atalhos pedem o período certo para a API", async () => {
    const api = simularApi({ ...logado("GESTOR"), "GET /faturamento/indicadores": indicadores });
    const usuario = renderizarApp("/relatorios");
    await screen.findByText("Mês a mês");

    await usuario.click(screen.getByText("Este ano"));

    const ultima = api.chamadas("GET /faturamento/indicadores").at(-1)!;
    expect(ultima.query.get("inicio")).toBe(`${hojeIso().slice(0, 4)}-01-01`);
    expect(ultima.query.get("fim")).toBe(hojeIso());
  });
});
