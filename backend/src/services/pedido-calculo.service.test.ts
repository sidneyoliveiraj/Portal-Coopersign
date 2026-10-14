import { describe, it, expect } from "vitest";
import {
  calcularMetragem,
  calcularValorBase,
  calcularValorTotal,
  DimensaoInvalidaError,
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

  it("rejeita quantidade zero, negativa ou fracionada", () => {
    expect(() => calcularMetragem(2, 3, 0)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(2, 3, -1)).toThrow(DimensaoInvalidaError);
    expect(() => calcularMetragem(2, 3, 1.5)).toThrow(DimensaoInvalidaError);
  });
});

describe("calcularValorBase", () => {
  it("calcula valor base com metragem inteira", () => {
    expect(calcularValorBase(6, 50)).toBe(300);
  });

  it("calcula valor base com metragem fracionada", () => {
    expect(calcularValorBase(9.9, 45.5)).toBeCloseTo(450.45);
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
});