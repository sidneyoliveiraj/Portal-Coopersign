// RF06: lê largura e altura do arquivo de arte no próprio navegador, sem enviar o arquivo.
// PDF (e .ai salvo com PDF): tamanho da página. Imagem (PNG, JPEG, TIFF): pixels ÷ DPI.

export type MedidasArquivo = { larguraCm: number; alturaCm: number; origem: string };

export class ArquivoSemMedidasError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ArquivoSemMedidasError";
  }
}

const CM_POR_POLEGADA = 2.54;

function umaCasa(valor: number) {
  return Math.round(valor * 10) / 10;
}

function texto(bytes: Uint8Array, inicio: number, tamanho: number) {
  return String.fromCharCode(...bytes.subarray(inicio, inicio + tamanho));
}

export function tipoDoArquivo(bytes: Uint8Array): "pdf" | "png" | "jpeg" | "tiff" | "cdr" | "desconhecido" {
  if (texto(bytes, 0, 4) === "%PDF") return "pdf";
  if (bytes[0] === 0x89 && texto(bytes, 1, 3) === "PNG") return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  const tiff = texto(bytes, 0, 4);
  if (tiff === "II*\0" || tiff === "MM\0*") return "tiff";
  if (texto(bytes, 0, 4) === "RIFF" && texto(bytes, 8, 3) === "CDR") return "cdr";
  return "desconhecido";
}

type Imagem = { larguraPx: number; alturaPx: number; dpiX: number | null; dpiY: number | null };

function lerPng(bytes: Uint8Array): Imagem {
  const dados = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const imagem: Imagem = { larguraPx: 0, alturaPx: 0, dpiX: null, dpiY: null };
  let pos = 8;
  while (pos + 8 <= bytes.length) {
    const tamanho = dados.getUint32(pos);
    const tipo = texto(bytes, pos + 4, 4);
    const inicio = pos + 8;
    if (tipo === "IHDR") {
      imagem.larguraPx = dados.getUint32(inicio);
      imagem.alturaPx = dados.getUint32(inicio + 4);
    } else if (tipo === "pHYs" && bytes[inicio + 8] === 1) {
      // unidade 1 = pixels por metro
      imagem.dpiX = (dados.getUint32(inicio) * CM_POR_POLEGADA) / 100;
      imagem.dpiY = (dados.getUint32(inicio + 4) * CM_POR_POLEGADA) / 100;
    } else if (tipo === "IDAT" || tipo === "IEND") {
      break;
    }
    pos = inicio + tamanho + 4;
  }
  return imagem;
}

/** Lê largura, altura e resolução de um bloco TIFF (arquivo .tif ou o EXIF de um JPEG). */
function lerTiff(bytes: Uint8Array, base = 0): Imagem {
  const dados = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const le = texto(bytes, base, 2) === "II";
  const u16 = (p: number) => dados.getUint16(base + p, le);
  const u32 = (p: number) => dados.getUint32(base + p, le);
  const imagem: Imagem = { larguraPx: 0, alturaPx: 0, dpiX: null, dpiY: null };
  let unidade = 2; // padrão do TIFF: polegada

  const ifd = u32(4);
  const total = u16(ifd);
  for (let i = 0; i < total; i++) {
    const entrada = ifd + 2 + i * 12;
    const tag = u16(entrada);
    const tipo = u16(entrada + 2);
    const valor = tipo === 3 ? u16(entrada + 8) : u32(entrada + 8);
    const racional = () => {
      const deslocamento = u32(entrada + 8);
      const divisor = u32(deslocamento + 4);
      return divisor ? u32(deslocamento) / divisor : null;
    };
    if (tag === 256) imagem.larguraPx = valor;
    if (tag === 257) imagem.alturaPx = valor;
    if (tag === 282) imagem.dpiX = racional();
    if (tag === 283) imagem.dpiY = racional();
    if (tag === 296) unidade = valor;
  }
  if (unidade === 3) {
    imagem.dpiX = imagem.dpiX && imagem.dpiX * CM_POR_POLEGADA;
    imagem.dpiY = imagem.dpiY && imagem.dpiY * CM_POR_POLEGADA;
  } else if (unidade === 1) {
    imagem.dpiX = null;
    imagem.dpiY = null;
  }
  return imagem;
}

const MARCADORES_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function lerJpeg(bytes: Uint8Array): Imagem {
  const dados = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const imagem: Imagem = { larguraPx: 0, alturaPx: 0, dpiX: null, dpiY: null };
  let exif: Imagem | null = null;
  let pos = 2;
  while (pos + 4 <= bytes.length && bytes[pos] === 0xff) {
    const marcador = bytes[pos + 1];
    const tamanho = dados.getUint16(pos + 2);
    const inicio = pos + 4;
    if (marcador === 0xe0 && texto(bytes, inicio, 5) === "JFIF\0") {
      const unidade = bytes[inicio + 7];
      const x = dados.getUint16(inicio + 8);
      const y = dados.getUint16(inicio + 10);
      if (unidade === 1 || unidade === 2) {
        const fator = unidade === 2 ? CM_POR_POLEGADA : 1;
        imagem.dpiX = x * fator;
        imagem.dpiY = y * fator;
      }
    } else if (marcador === 0xe1 && texto(bytes, inicio, 6) === "Exif\0\0") {
      exif = lerTiff(bytes, inicio + 6);
    } else if (MARCADORES_SOF.has(marcador)) {
      imagem.alturaPx = dados.getUint16(inicio + 1);
      imagem.larguraPx = dados.getUint16(inicio + 3);
      break;
    }
    pos = inicio + tamanho - 2;
  }
  if (imagem.dpiX === null && exif) {
    imagem.dpiX = exif.dpiX;
    imagem.dpiY = exif.dpiY;
  }
  return imagem;
}

export function medidasDaImagem(imagem: Imagem, formato: string): MedidasArquivo {
  if (!imagem.larguraPx || !imagem.alturaPx) {
    throw new ArquivoSemMedidasError(`Não foi possível ler o tamanho deste ${formato}.`);
  }
  if (!imagem.dpiX || !imagem.dpiY || imagem.dpiX <= 1 || imagem.dpiY <= 1) {
    throw new ArquivoSemMedidasError(
      `O ${formato} tem ${imagem.larguraPx} × ${imagem.alturaPx} pixels, mas não informa a resolução (DPI). Digite as medidas.`,
    );
  }
  return {
    larguraCm: umaCasa((imagem.larguraPx / imagem.dpiX) * CM_POR_POLEGADA),
    alturaCm: umaCasa((imagem.alturaPx / imagem.dpiY) * CM_POR_POLEGADA),
    origem: `${formato}: ${imagem.larguraPx} × ${imagem.alturaPx} px a ${Math.round(imagem.dpiX)} DPI`,
  };
}

async function medidasDoPdf(bytes: Uint8Array): Promise<MedidasArquivo> {
  const { PDFDocument } = await import("pdf-lib");
  let documento;
  let pagina;
  try {
    documento = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    // Um PDF corrompido pode abrir e só falhar ao ler a página; os dois ficam no mesmo try.
    pagina = documento.getPage(0);
  } catch {
    throw new ArquivoSemMedidasError("Não foi possível abrir este PDF. Digite as medidas.");
  }
  // TrimBox é o tamanho final do impresso; sem ela, o pdf-lib devolve a MediaBox.
  const caixa = pagina.getTrimBox();
  const deitada = pagina.getRotation().angle % 180 !== 0;
  const pontosParaCm = (pt: number) => umaCasa((pt / 72) * CM_POR_POLEGADA);
  const paginas = documento.getPageCount();
  return {
    larguraCm: pontosParaCm(deitada ? caixa.height : caixa.width),
    alturaCm: pontosParaCm(deitada ? caixa.width : caixa.height),
    origem: paginas > 1 ? `PDF: página 1 de ${paginas}` : "PDF",
  };
}

export async function lerMedidasDoArquivo(bytes: Uint8Array): Promise<MedidasArquivo> {
  switch (tipoDoArquivo(bytes)) {
    case "pdf":
      return medidasDoPdf(bytes);
    case "png":
      return medidasDaImagem(lerPng(bytes), "PNG");
    case "jpeg":
      return medidasDaImagem(lerJpeg(bytes), "JPEG");
    case "tiff":
      return medidasDaImagem(lerTiff(bytes), "TIFF");
    case "cdr":
      throw new ArquivoSemMedidasError(
        "Arquivo do CorelDraw: o formato é fechado e não dá para ler as medidas. Digite as medidas ou exporte em PDF.",
      );
    default:
      throw new ArquivoSemMedidasError("Formato não reconhecido. Use PDF, PNG, JPEG ou TIFF, ou digite as medidas.");
  }
}
