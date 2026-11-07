export class DimensaoInvalidaError extends Error {}

export class ValorInvalidoError extends Error {}

export const METRAGEM_MINIMA_UNIDADE = 1;

export function arredondarCentavos(valor: number): number {
  return Math.round(Number((valor * 100).toFixed(6))) / 100;
}

function positivoFinito(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0;
}

export function calcularMetragem(largura: number, altura: number, quantidade: number): number {
  if (!positivoFinito(largura) || !positivoFinito(altura)) {
    throw new DimensaoInvalidaError("largura e altura devem ser maiores que zero");
  }

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new DimensaoInvalidaError("quantidade deve ser um inteiro maior que zero");
  }

  return largura * altura * quantidade;
}

export function calcularMetragemCobrada(largura: number, altura: number, quantidade: number): number {
  const metragemUnidade = calcularMetragem(largura, altura, 1);
  return calcularMetragem(1, Math.max(metragemUnidade, METRAGEM_MINIMA_UNIDADE), quantidade);
}

export function calcularValorBase(metragem: number, precoM2: number): number {
  return arredondarCentavos(metragem * precoM2);
}

export function calcularValorTotal(
  valorBase: number,
  servicosAdicionais: number[],
  ajustes: number[]
): number {
  const totalServicos = servicosAdicionais.reduce((soma, valor) => soma + valor, 0);
  const totalAjustes = ajustes.reduce((soma, valor) => soma + valor, 0);
  const total = arredondarCentavos(valorBase + totalServicos + totalAjustes);

  if (total < 0) {
    throw new ValorInvalidoError("valor total nao pode ser negativo");
  }

  return total;
}
