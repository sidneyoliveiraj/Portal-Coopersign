export class DimensaoInvalidaError extends Error {}

export function calcularMetragem(largura: number, altura: number, quantidade: number): number {
  if (!(largura > 0) || !(altura > 0)) {
    throw new DimensaoInvalidaError("largura e altura devem ser maiores que zero");
  }

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new DimensaoInvalidaError("quantidade deve ser um inteiro maior que zero");
  }

  return largura * altura * quantidade;
}

export function calcularValorBase(metragem: number, precoM2: number): number {
  return metragem * precoM2;
}

export function calcularValorTotal(
  valorBase: number,
  servicosAdicionais: number[],
  ajustes: number[]
): number {
  const totalServicos = servicosAdicionais.reduce((soma, valor) => soma + valor, 0);
  const totalAjustes = ajustes.reduce((soma, valor) => soma + valor, 0);
  return valorBase + totalServicos + totalAjustes;
}
