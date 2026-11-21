import { describe, expect, it } from "vitest";
import {
  aplicouMinimo,
  arredondarCentavos,
  cmParaMetros,
  ehLink,
  formatarArea,
  formatarData,
  formatarDimensoes,
  formatarMedidas,
  formatarMetragem,
  formatarMoeda,
  metragemCobrada,
  nomeDoMes,
  periodoDoAtalho,
} from "./formato";

// O Intl usa espaço não separável depois do "R$"; troca por espaço comum para comparar.
const semNbsp = (texto: string) => texto.replace(/\s/g, " ");

describe("formatação de valores", () => {
  it("formata moeda em reais, aceitando texto vindo da API", () => {
    expect(semNbsp(formatarMoeda(29))).toBe("R$ 29,00");
    expect(semNbsp(formatarMoeda("1234.5"))).toBe("R$ 1.234,50");
  });

  it("formata área com duas casas", () => {
    expect(formatarArea(0.9724)).toBe("0,97 m²");
    expect(formatarArea("21.8")).toBe("21,80 m²");
  });

  it("mostra medidas em centímetros a partir dos metros do banco", () => {
    const pedido = { largura: "1.041", altura: "0.935", quantidade: 1 };
    expect(formatarDimensoes(pedido)).toBe("104,1 × 93,5 cm");
    expect(formatarMedidas(pedido)).toBe("104,1 × 93,5 cm (1 unidade)");
    expect(formatarMedidas({ ...pedido, quantidade: 4 })).toBe("104,1 × 93,5 cm (4 unidades)");
  });

  it("converte centímetros para metros com 3 casas", () => {
    expect(cmParaMetros("117,5".replace(",", "."))).toBe(1.175);
    expect(cmParaMetros(93.5)).toBe(0.935);
  });

  it("arredonda centavos sem erro de ponto flutuante", () => {
    expect(arredondarCentavos(1.005)).toBe(1.01);
    expect(arredondarCentavos(63.4075)).toBe(63.41);
  });

  it("formata data do prazo sem mudar o dia por causa do fuso", () => {
    expect(formatarData("2026-11-16T00:00:00.000Z")).toBe("16/11/2026");
  });
});

describe("cobrança mínima de 1 m² por unidade (RN16)", () => {
  it("cobra 1 m² quando a peça é menor", () => {
    expect(metragemCobrada(1, 0.78, 1)).toBe(1);
    expect(metragemCobrada(1.1, 0.8, 4)).toBe(4);
  });

  it("cobra a metragem real quando a peça passa de 1 m²", () => {
    expect(metragemCobrada(1.175, 1.861, 1)).toBeCloseTo(2.1867, 4);
  });

  it("avisa na tela quando o mínimo foi aplicado", () => {
    expect(aplicouMinimo({ largura: "1", altura: "0.78" })).toBe(true);
    expect(formatarMetragem({ largura: "1", altura: "0.78", metragemTotal: "0.78" })).toBe(
      "0,78 m² (mínimo de 1 m² por unidade)",
    );
    expect(formatarMetragem({ largura: "2", altura: "1", metragemTotal: "2" })).toBe("2,00 m²");
  });
});

describe("atalhos de período do relatório", () => {
  it("este mês vai do dia 1 até hoje", () => {
    expect(periodoDoAtalho("mes", "2026-11-13")).toEqual({ inicio: "2026-11-01", fim: "2026-11-13" });
  });

  it("este ano vai de 1º de janeiro até hoje", () => {
    expect(periodoDoAtalho("ano", "2026-11-13")).toEqual({ inicio: "2026-01-01", fim: "2026-11-13" });
  });

  it("mês passado pega o mês inteiro, inclusive fevereiro e a virada do ano", () => {
    expect(periodoDoAtalho("mesPassado", "2026-11-13")).toEqual({ inicio: "2026-10-01", fim: "2026-10-31" });
    expect(periodoDoAtalho("mesPassado", "2026-03-05")).toEqual({ inicio: "2026-02-01", fim: "2026-02-28" });
    expect(periodoDoAtalho("mesPassado", "2026-01-10")).toEqual({ inicio: "2025-12-01", fim: "2025-12-31" });
  });

  it("escreve o nome do mês por extenso ou curto", () => {
    expect(nomeDoMes("2026-10")).toBe("Outubro/2026");
    expect(nomeDoMes("2026-03", true)).toBe("mar/26");
  });
});

describe("referência do arquivo de arte", () => {
  it("reconhece links do WeTransfer, Drive e OneDrive", () => {
    expect(ehLink("https://we.tl/t-AbC123")).toBe(true);
    expect(ehLink("  https://drive.google.com/file/d/1/view  ")).toBe(true);
    expect(ehLink("http://exemplo.com/arte.pdf")).toBe(true);
  });

  it("trata texto livre e nome de arquivo como texto", () => {
    expect(ehLink("WhatsApp do Charles")).toBe(false);
    expect(ehLink("banner-110x80.pdf")).toBe(false);
    expect(ehLink("https://link com espaço")).toBe(false);
  });
});
