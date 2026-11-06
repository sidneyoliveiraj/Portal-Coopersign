const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const area = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const centimetros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const METRAGEM_MINIMA_UNIDADE = 1;

export function formatarMoeda(valor: number | string) {
  return moeda.format(Number(valor));
}

export function formatarArea(valor: number | string) {
  return `${area.format(Number(valor))} m²`;
}

export function formatarDimensoes(pedido: { largura: string; altura: string }) {
  return `${centimetros.format(Number(pedido.largura) * 100)} × ${centimetros.format(Number(pedido.altura) * 100)} cm`;
}

export function formatarMedidas(pedido: { largura: string; altura: string; quantidade: number }) {
  const unidades = pedido.quantidade === 1 ? "1 unidade" : `${pedido.quantidade} unidades`;
  return `${formatarDimensoes(pedido)} (${unidades})`;
}

export function cmParaMetros(valor: number | string) {
  return Number((Number(valor) / 100).toFixed(3));
}

export function arredondarCentavos(valor: number) {
  return Math.round(Number((valor * 100).toFixed(6))) / 100;
}

export function metragemCobrada(largura: number, altura: number, quantidade: number) {
  return Math.max(largura * altura, METRAGEM_MINIMA_UNIDADE) * quantidade;
}

export function aplicouMinimo(pedido: { largura: string; altura: string }) {
  return Number(pedido.largura) * Number(pedido.altura) < METRAGEM_MINIMA_UNIDADE;
}

export function formatarMetragem(pedido: { largura: string; altura: string; metragemTotal: string }) {
  const real = formatarArea(pedido.metragemTotal);
  return aplicouMinimo(pedido) ? `${real} (mínimo de 1 m² por unidade)` : real;
}

export function hojeIso() {
  return new Date().toLocaleDateString("en-CA");
}

export function inicioDoMes() {
  return `${hojeIso().slice(0, 7)}-01`;
}

export function formatarData(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatarMomento(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR");
}

export const STATUS_PEDIDO: Record<string, { rotulo: string; cor: string }> = {
  RASCUNHO: { rotulo: "Rascunho", cor: "gray" },
  AGUARDANDO_VALIDACAO: { rotulo: "Aguardando validação", cor: "yellow" },
  NA_FILA: { rotulo: "Na fila", cor: "indigo" },
  EM_PRODUCAO: { rotulo: "Em produção", cor: "blue" },
  CONCLUIDO: { rotulo: "Concluído", cor: "green" },
  RETRABALHO: { rotulo: "Retrabalho", cor: "orange" },
  FATURADO: { rotulo: "Faturado", cor: "teal" },
  REJEITADO: { rotulo: "Rejeitado", cor: "red" },
};

export const FORMA_PAGAMENTO: Record<string, string> = {
  A_VISTA: "À vista",
  EM_CONTA: "Em conta",
};
