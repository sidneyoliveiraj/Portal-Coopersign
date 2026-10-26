const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const area = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatarMoeda(valor: number | string) {
  return moeda.format(Number(valor));
}

export function formatarArea(valor: number | string) {
  return `${area.format(Number(valor))} m²`;
}

export function formatarData(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export const STATUS_PEDIDO: Record<string, { rotulo: string; cor: string }> = {
  RASCUNHO: { rotulo: "Rascunho", cor: "gray" },
  AGUARDANDO_VALIDACAO: { rotulo: "Aguardando validação", cor: "yellow" },
  EM_PRODUCAO: { rotulo: "Em produção", cor: "blue" },
  CONCLUIDO: { rotulo: "Concluído", cor: "green" },
  FATURADO: { rotulo: "Faturado", cor: "teal" },
  REJEITADO: { rotulo: "Rejeitado", cor: "red" },
};

export const FORMA_PAGAMENTO: Record<string, string> = {
  A_VISTA: "À vista",
  EM_CONTA: "Em conta",
};
