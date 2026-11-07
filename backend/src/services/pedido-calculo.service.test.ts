import { describe, it, expect } from "vitest";
import {
  calcularMetragem,
  calcularMetragemCobrada,
  calcularValorBase,
  calcularValorTotal,
  DimensaoInvalidaError,
  ValorInvalidoError,
} from "./pedido-calculo.service";

describe("calcularMetragem", () => {
  it("calcula metragem com dimensões inteiras", () => {
    expect(calcularMetragem(2, 3, 1)).toBe(6);
  });

  it("calcula metragem com dimensões fracionadas", () => {
    expect(calcularMetragem(1.5, 2.2, 3)).toBeCloseTo(9.9);
  });

  it("rejeita largura ou altura negativa", () => {
    expect(() => calcularMetragem(-2, 3, 1)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(2, -3, 1)).toThrow(DimensaoInvalidaError);
  });

  it("rejeita dimensão zero ou inválida", () => {
    expect(() => calcularMetragem(0, 3, 1)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(Number.NaN, 3, 1)).toThrow(DimensaoInvalidaError);
  });

  it("rejeita dimensão infinita", () => {
    expect(() => calcularMetragem(Infinity, 1, 1)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(1, Infinity, 1)).toThrow(DimensaoInvalidaError);
  });

  it("rejeita quantidade zero, negativa ou fracionada", () => {
    expect(() => calcularMetragem(2, 3, 0)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(2, 3, -1)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(2, 3, 1.5)).toThrow(DimensaoInvalidaError);
  });
});

describe("calcularMetragemCobrada", () => {
  it("cobra 1 m² quando a unidade tem menos que isso", () => {
    expect(calcularMetragemCobrada(1, 0.78, 1)).toBe(1);
  });

  it("aplica o mínimo em cada unidade, não no pedido", () => {
    expect(calcularMetragemCobrada(1.1, 0.8, 4)).toBe(4);
  });

  it("usa a metragem real quando a unidade tem 1 m² ou mais", () => {
    expect(calcularMetragemCobrada(1, 1, 1)).toBe(1);
    expect(calcularMetragemCobrada(1.2, 2.2, 2)).toBeCloseTo(5.28);
  });

  it("rejeita dimensão ou quantidade inválida", () => {
    expect(() => calcularMetragemCobrada(0, 1, 1)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragemCobrada(1, 1, 0)).toThrow(DimensaoInvalidaError);
  });
});

describe("calcularValorBase", () => {
  it("calcula valor base com metragem inteira", () => {
    expect(calcularValorBase(6, 50)).toBe(300);
  });

  it("calcula valor base com metragem fracionada", () => {
    expect(calcularValorBase(9.9, 45.5)).toBeCloseTo(450.45);
  });

  it("arredonda para centavos", () => {
    expect(calcularValorBase(calcularMetragem(1.1, 1.1, 1), 35.9)).toBe(43.44);
  });
});

describe("calcularValorTotal", () => {
  it("soma valor base, serviços adicionais e ajustes", () => {
    expect(calcularValorTotal(300, [20, 15], [10])).toBe(345);
  });

  it("aplica ajuste negativo (desconto)", () => {
    expect(calcularValorTotal(300, [20], [-30])).toBe(290);
  });

  it("funciona sem serviços nem ajustes", () => {
    expect(calcularValorTotal(300, [], [])).toBe(300);
  });

  it("arredonda o total para centavos", () => {
    expect(calcularValorTotal(0.1, [0.2], [])).toBe(0.3);
  });

  it("rejeita desconto maior que o pedido", () => {
    expect(() => calcularValorTotal(100, [], [-150])).toThrow(ValorInvalidoError);
  });

  it("aceita desconto que zera o pedido", () => {
    expect(calcularValorTotal(100, [], [-100])).toBe(0);
  });
});