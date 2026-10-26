export type Cliente = { id: string; nome: string };

export type Material = { id: string; tipo: string; precoM2: string };

export type ServicoAdicional = { id: string; descricao: string; valorPadrao: string };

export type AjusteValor = { id: string; descricao: string; valor: string; criadoEm: string };

export type Pedido = {
  id: string;
  status: string;
  largura: string;
  altura: string;
  quantidade: number;
  acabamento: string;
  arquivoUrl: string;
  formaPagamento: string;
  prazoEntrega: string;
  metragemTotal: string;
  valorBase: string;
  valorTotal: string;
  criadoEm: string;
  cliente: Cliente;
  material: Material;
  pedidoServicos?: {
    id: string;
    quantidade: number;
    valorUnitario: string;
    servicoAdicional: ServicoAdicional;
  }[];
  ajustesValor?: AjusteValor[];
};
