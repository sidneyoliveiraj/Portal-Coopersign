import { describe, it, expect } from "vitest";
import { clienteDoNome, lerNomeDoArquivo, materialDoNome, medidasDoNome, quantidadeDoNome } from "./nomeArquivo";

const clientes = [
  { id: "c1", nome: "Savio" },
  { id: "c2", nome: "Charles" },
  { id: "c3", nome: "Coopersign" },
  { id: "c4", nome: "Top Birds" },
  { id: "c5", nome: "Top Graphics" },
];

const materiais = [
  { id: "m1", tipo: "Adesivo brilho 106", precoM2: "38" },
  { id: "m2", tipo: "Adesivo fosco 127", precoM2: "40" },
  { id: "m3", tipo: "Lona backlight", precoM2: "62.9" },
  { id: "m4", tipo: "Adesivo perfurado", precoM2: "52" },
];

const SAVIO =
  "Cliente SAVIO_ADESIVO DO CLIENTE AUTOMOTIVO_Data 010926_Quantidade 1x_Medida 119,7 x 35,6cm_CooperSign_Centralizar na mídia_UNIDIRECIONAL_USAR PERFIL RIP NOVO_AZUL.pdf";

describe("nome do arquivo", () => {
  it("le cliente, quantidade e medida do padrao da Coopersign", () => {
    expect(lerNomeDoArquivo(SAVIO, clientes, materiais)).toEqual({
      clienteId: "c1",
      materialId: undefined,
      quantidade: 1,
      larguraCm: 119.7,
      alturaCm: 35.6,
    });
  });

  it("com rotulo Cliente, usa o rotulo e ignora o CooperSign do resto do nome", () => {
    expect(clienteDoNome(SAVIO, clientes)?.id).toBe("c1");
  });

  it("sem rotulo, acha o cliente que aparece no nome", () => {
    expect(clienteDoNome("Charles - adesivo - 110,90x183,30.pdf", clientes)?.id).toBe("c2");
  });

  it("cliente que nao bate com um unico cadastro fica em branco", () => {
    expect(clienteDoNome("Cliente Top_banner.pdf", clientes)).toBeUndefined();
    expect(clienteDoNome("Cliente Fulano_banner.pdf", clientes)).toBeUndefined();
  });

  it("ignora acentos e maiusculas", () => {
    expect(clienteDoNome("cliente SÁVIO_x.pdf", clientes)?.id).toBe("c1");
  });

  it("material so e escolhido quando todas as palavras aparecem e sobra um", () => {
    expect(materialDoNome("Cliente X_ADESIVO FOSCO 127_Medida 10x10.pdf", materiais)?.id).toBe("m2");
    expect(materialDoNome("Cliente X_Lona Backlight.pdf", materiais)?.id).toBe("m3");
    expect(materialDoNome(SAVIO, materiais)).toBeUndefined();
  });

  it.each([
    ["Medida 119,7 x 35,6cm", 119.7, 35.6],
    ["Charles - adesivo - 110,90x183,30.pdf", 110.9, 183.3],
    ["banner 1200 x 800 mm.pdf", 120, 80],
    ["faixa 3x0,5m.cdr", 300, 50],
    ["placa 50.5 X 30.pdf", 50.5, 30],
  ])("medida em %s", (nome, larguraCm, alturaCm) => {
    expect(medidasDoNome(nome)).toEqual({ larguraCm, alturaCm });
  });

  it("nome sem medida devolve nulo e quantidade 1x nao vira medida", () => {
    expect(medidasDoNome("Cliente SAVIO_Quantidade 2x_logo.pdf")).toBeNull();
  });

  it.each([
    ["Quantidade 3x", 3],
    ["Qtd 10", 10],
    ["qtde: 2", 2],
    ["sem quantidade", undefined],
    ["Quantidade 0x", undefined],
  ])("quantidade em %s", (nome, esperado) => {
    expect(quantidadeDoNome(nome)).toBe(esperado);
  });
});
