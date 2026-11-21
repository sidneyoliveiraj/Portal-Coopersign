import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { ArquivoSemMedidasError, lerMedidasDoArquivo, tipoDoArquivo } from "./medidasArquivo";

// Arte de 20 × 10 cm a 300 DPI = 2362 × 1181 pixels.
const LARGURA_PX = 2362;
const ALTURA_PX = 1181;

const ascii = (texto: string) => [...texto].map((c) => c.charCodeAt(0));
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16be = (n: number) => [(n >>> 8) & 255, n & 255];
const u16le = (n: number) => [n & 255, (n >>> 8) & 255];
const u32le = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];

function bloco(tipo: string, dados: number[]) {
  return [...u32be(dados.length), ...ascii(tipo), ...dados, 0, 0, 0, 0]; // CRC não é conferido
}

function png(comDpi: boolean) {
  const pixelsPorMetro = Math.round(300 / 0.0254);
  return new Uint8Array([
    0x89, ...ascii("PNG\r\n"), 0x1a, 0x0a,
    ...bloco("IHDR", [...u32be(LARGURA_PX), ...u32be(ALTURA_PX), 8, 2, 0, 0, 0]),
    ...(comDpi ? bloco("pHYs", [...u32be(pixelsPorMetro), ...u32be(pixelsPorMetro), 1]) : []),
    ...bloco("IEND", []),
  ]);
}

function jpeg(unidadeDpi: number) {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, ...u16be(16), ...ascii("JFIF\0"), 1, 1, unidadeDpi, ...u16be(300), ...u16be(300), 0, 0,
    0xff, 0xc0, ...u16be(17), 8, ...u16be(ALTURA_PX), ...u16be(LARGURA_PX), 3, ...new Array(9).fill(0),
  ]);
}

function tiff() {
  const entrada = (tag: number, tipo: number, valor: number) => [...u16le(tag), ...u16le(tipo), ...u32le(1), ...u32le(valor)];
  // IFD começa no byte 8, com 5 entradas; os dois DPI (frações) ficam logo depois, nos bytes 74 e 82.
  return new Uint8Array([
    ...ascii("II*\0"), ...u32le(8),
    ...u16le(5),
    ...entrada(256, 3, LARGURA_PX),
    ...entrada(257, 3, ALTURA_PX),
    ...entrada(282, 5, 74),
    ...entrada(283, 5, 82),
    ...entrada(296, 3, 2),
    ...u32le(0),
    ...u32le(300), ...u32le(1),
    ...u32le(300), ...u32le(1),
  ]);
}

async function pdf(larguraCm: number, alturaCm: number, opcoes: { girar?: boolean; paginas?: number } = {}) {
  const documento = await PDFDocument.create();
  const pontos = (cm: number) => (cm / 2.54) * 72;
  for (let i = 0; i < (opcoes.paginas ?? 1); i++) {
    const pagina = documento.addPage([pontos(larguraCm), pontos(alturaCm)]);
    if (opcoes.girar) pagina.setRotation(degrees(90));
  }
  return documento.save();
}

describe("reconhece o tipo pelo conteúdo, não pela extensão", () => {
  it("identifica cada formato", async () => {
    expect(tipoDoArquivo(await pdf(10, 10))).toBe("pdf");
    expect(tipoDoArquivo(png(true))).toBe("png");
    expect(tipoDoArquivo(jpeg(1))).toBe("jpeg");
    expect(tipoDoArquivo(tiff())).toBe("tiff");
    expect(tipoDoArquivo(new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("CDR")]))).toBe("cdr");
    expect(tipoDoArquivo(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe("desconhecido");
  });
});

describe("lê as medidas da arte (RF06)", () => {
  it("PDF: tamanho da página", async () => {
    expect(await lerMedidasDoArquivo(await pdf(20, 10))).toEqual({ larguraCm: 20, alturaCm: 10, origem: "PDF" });
  });

  it("PDF girado troca largura e altura", async () => {
    const medidas = await lerMedidasDoArquivo(await pdf(100, 50, { girar: true }));
    expect([medidas.larguraCm, medidas.alturaCm]).toEqual([50, 100]);
  });

  it("PDF com várias páginas usa a primeira e avisa", async () => {
    const medidas = await lerMedidasDoArquivo(await pdf(20, 10, { paginas: 3 }));
    expect(medidas.origem).toBe("PDF: página 1 de 3");
  });

  it("PNG, JPEG e TIFF: pixels ÷ DPI", async () => {
    for (const arquivo of [png(true), jpeg(1), tiff()]) {
      const medidas = await lerMedidasDoArquivo(arquivo);
      expect([medidas.larguraCm, medidas.alturaCm]).toEqual([20, 10]);
      expect(medidas.origem).toContain("2362 × 1181 px a 300 DPI");
    }
  });

  it("JPEG com DPI em pontos por centímetro", async () => {
    // 300 pontos/cm: a mesma imagem fica 2,54 vezes menor
    const medidas = await lerMedidasDoArquivo(jpeg(2));
    expect([medidas.larguraCm, medidas.alturaCm]).toEqual([7.9, 3.9]);
  });
});

describe("quando não dá para ler, pede para digitar (RF07)", () => {
  it("imagem sem DPI", async () => {
    await expect(lerMedidasDoArquivo(png(false))).rejects.toThrow(/não informa a resolução/);
    await expect(lerMedidasDoArquivo(jpeg(0))).rejects.toThrow(ArquivoSemMedidasError);
  });

  it("arquivo do CorelDraw", async () => {
    const cdr = new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("CDR")]);
    await expect(lerMedidasDoArquivo(cdr)).rejects.toThrow(/CorelDraw/);
  });

  it("formato desconhecido", async () => {
    await expect(lerMedidasDoArquivo(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).rejects.toThrow(/não reconhecido/);
  });

  it("PDF corrompido", async () => {
    await expect(lerMedidasDoArquivo(new Uint8Array(ascii("%PDF-1.4 lixo")))).rejects.toThrow(ArquivoSemMedidasError);
  });
});
