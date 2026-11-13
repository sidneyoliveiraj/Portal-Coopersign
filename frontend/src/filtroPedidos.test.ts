import { describe, expect, it } from "vitest";
import { FILTRO_VAZIO, filtrarPedidos, filtroAtivo } from "./filtroPedidos";
import type { Pedido } from "./tipos";

function pedido(id: string, status: string, clienteId: string, criadoEm: string, retrabalhos = 0): Pedido {
  return {
    id,
    status,
    criadoEm,
    cliente: { id: clienteId, nome: clienteId },
    _count: { retrabalhos },
  } as Pedido;
}

const pedidos = [
  pedido("1", "NA_FILA", "charles", "2026-11-03T12:00:00-03:00"),
  pedido("2", "CONCLUIDO", "savio", "2026-11-10T09:00:00-03:00", 1),
  pedido("3", "FATURADO", "charles", "2026-10-28T15:00:00-03:00"),
  // 23h30 de 12/11 em Brasília já é dia 13 em UTC: deve contar como 12/11
  pedido("4", "RETRABALHO", "topbirds", "2026-11-12T23:30:00-03:00"),
];

const ids = (lista: Pedido[]) => lista.map((p) => p.id);

describe("filtro da lista de pedidos", () => {
  it("sem filtro devolve tudo", () => {
    expect(ids(filtrarPedidos(pedidos, FILTRO_VAZIO))).toEqual(["1", "2", "3", "4"]);
    expect(filtroAtivo(FILTRO_VAZIO)).toBe(false);
  });

  it("filtra por um ou vários status", () => {
    expect(ids(filtrarPedidos(pedidos, { ...FILTRO_VAZIO, status: ["NA_FILA"] }))).toEqual(["1"]);
    expect(ids(filtrarPedidos(pedidos, { ...FILTRO_VAZIO, status: ["NA_FILA", "FATURADO"] }))).toEqual(["1", "3"]);
  });

  it("'Retrabalho' acha também quem teve retrabalho e já foi concluído", () => {
    expect(ids(filtrarPedidos(pedidos, { ...FILTRO_VAZIO, status: ["RETRABALHO"] }))).toEqual(["2", "4"]);
  });

  it("filtra por cliente", () => {
    expect(ids(filtrarPedidos(pedidos, { ...FILTRO_VAZIO, clienteId: "charles" }))).toEqual(["1", "3"]);
  });

  it("filtra pela data de entrada, no dia de Brasília", () => {
    const novembro = { ...FILTRO_VAZIO, inicio: "2026-11-01", fim: "2026-11-12" };
    expect(ids(filtrarPedidos(pedidos, novembro))).toEqual(["1", "2", "4"]);
    expect(filtroAtivo(novembro)).toBe(true);
  });

  it("combina status, cliente e período", () => {
    const filtro = { status: ["NA_FILA", "FATURADO"], clienteId: "charles", inicio: "2026-11-01", fim: "" };
    expect(ids(filtrarPedidos(pedidos, filtro))).toEqual(["1"]);
  });
});
