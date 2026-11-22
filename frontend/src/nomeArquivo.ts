import type { Cliente, Material } from "./tipos";

// Le o nome do arquivo de arte no padrao usado pelos clientes e pelo finalizador, ex.:
// "Cliente SAVIO_ADESIVO..._Quantidade 1x_Medida 119,7 x 35,6cm_CooperSign_....pdf"
// Cliente e material so sao escolhidos quando batem com um unico cadastro.
export type DadosDoNome = {
  clienteId?: string;
  materialId?: string;
  quantidade?: number;
  larguraCm?: number;
  alturaCm?: number;
};

const NUMERO = String.raw`(\d+(?:[.,]\d+)?)`;
const MEDIDA = String.raw`${NUMERO}\s*x\s*${NUMERO}\s*(mm|cm|m)?(?![a-z])`;
const PARA_CM: Record<string, number> = { mm: 0.1, cm: 1, m: 100 };

export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function palavras(texto: string) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

function numero(texto: string) {
  return Number(texto.replace(",", "."));
}

function semExtensao(nome: string) {
  return nome.replace(/\.[a-z0-9]{2,4}$/i, "");
}

export function medidasDoNome(nome: string) {
  const texto = semExtensao(nome);
  const achado = new RegExp(String.raw`medida\s*:?\s*${MEDIDA}`, "i").exec(texto) ?? new RegExp(MEDIDA, "i").exec(texto);
  if (!achado) return null;
  const fator = PARA_CM[(achado[3] ?? "cm").toLowerCase()];
  return {
    larguraCm: Math.round(numero(achado[1]) * fator * 10) / 10,
    alturaCm: Math.round(numero(achado[2]) * fator * 10) / 10,
  };
}

export function quantidadeDoNome(nome: string) {
  const achado = /(?:quantidade|qtde|qtd)\.?\s*:?\s*(\d+)/i.exec(nome);
  const quantidade = achado ? Number(achado[1]) : 0;
  return quantidade > 0 ? quantidade : undefined;
}

// Todas as palavras do cadastro precisam aparecer no texto; vale so se sobrar um.
function unicoQueAparece<T>(itens: T[], texto: string, nomeDoItem: (item: T) => string) {
  const doTexto = new Set(palavras(texto));
  const candidatos = itens.filter((item) => {
    const doItem = palavras(nomeDoItem(item));
    return doItem.length > 0 && doItem.every((p) => doTexto.has(p));
  });
  return candidatos.length === 1 ? candidatos[0] : undefined;
}

export function clienteDoNome(nome: string, clientes: Cliente[]) {
  const rotulo = /cliente\s*:?\s*([^_]+)/i.exec(semExtensao(nome));
  if (rotulo) {
    const procurado = palavras(rotulo[1]).join(" ");
    const iguais = clientes.filter((c) => palavras(c.nome).join(" ") === procurado);
    const achado = iguais.length === 1 ? iguais[0] : unicoQueAparece(clientes, rotulo[1], (c) => c.nome);
    if (achado) return achado;
  }
  return unicoQueAparece(clientes, semExtensao(nome), (c) => c.nome);
}

export function materialDoNome(nome: string, materiais: Material[]) {
  return unicoQueAparece(materiais, semExtensao(nome), (m) => m.tipo);
}

export function lerNomeDoArquivo(nome: string, clientes: Cliente[], materiais: Material[]): DadosDoNome {
  return {
    clienteId: clienteDoNome(nome, clientes)?.id,
    materialId: materialDoNome(nome, materiais)?.id,
    quantidade: quantidadeDoNome(nome),
    ...medidasDoNome(nome),
  };
}
