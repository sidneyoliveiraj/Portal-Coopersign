export function calcularMetragem(largura: number, altura: number, quantidade: number): number {
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
