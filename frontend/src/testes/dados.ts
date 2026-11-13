// Dados de exemplo usados nos testes de tela (clientes fictícios).
import type { Pedido } from "../tipos";

export const clientes = [
  { id: "c-1", nome: "Gráfica Aurora" },
  { id: "c-2", nome: "Studio Mod" },
];

export const materiais = [
  { id: "m-1", tipo: "Adesivo brilho 106", precoM2: "29.00" },
  { id: "m-2", tipo: "Lona fosca 120", precoM2: "45.00" },
];

export const servicos = [{ id: "s-1", descricao: "Ilhós", valorPadrao: "10.00" }];

export const maquinas = [
  { id: "maq-1", nome: "Firejet", tipo: "Impressora", status: "ATIVA" },
  { id: "maq-2", nome: "Plotter velha", tipo: "Impressora", status: "MANUTENCAO" },
];

export function umPedido(dados: Partial<Pedido> = {}): Pedido {
  return {
    id: "p-1",
    status: "AGUARDANDO_VALIDACAO",
    largura: "1.041",
    altura: "0.935",
    quantidade: 1,
    acabamento: "sem acabamento",
    arquivoUrl: "banner-104x93.pdf",
    formaPagamento: "A_VISTA",
    prazoEntrega: "2026-11-20T00:00:00.000Z",
    metragemTotal: "0.97",
    valorBase: "29.00",
    valorTotal: "29.00",
    criadoEm: "2026-11-13T13:00:00.000Z",
    iniciadoEm: null,
    concluidoEm: null,
    cliente: clientes[0],
    material: materiais[0],
    maquina: null,
    pedidoServicos: [],
    ajustesValor: [],
    retrabalhos: [],
    _count: { retrabalhos: 0 },
    ...dados,
  };
}
