// Backend falso para os testes de tela: troca o fetch do navegador por respostas fixas.
// As chaves são "MÉTODO /caminho" (sem a query), ex.: "GET /pedidos" ou "POST /auth/login".
import { vi } from "vitest";

export type Requisicao = { metodo: string; caminho: string; query: URLSearchParams; corpo: unknown };

class RespostaDeErro {
  constructor(
    readonly status: number,
    readonly erro: string,
  ) {}
}

/** Resposta de erro da API, ex.: erroDaApi(401, "credenciais invalidas"). */
export function erroDaApi(status: number, erro: string) {
  return new RespostaDeErro(status, erro);
}

type Resposta = unknown | ((requisicao: Requisicao) => unknown);

export function simularApi(rotas: Record<string, Resposta>) {
  const requisicoes: Requisicao[] = [];

  vi.spyOn(globalThis, "fetch").mockImplementation(async (entrada, opcoes) => {
    const url = new URL(String(entrada));
    const caminho = url.pathname.replace(/^\/api/, "");
    const metodo = opcoes?.method ?? "GET";
    const corpo = opcoes?.body ? JSON.parse(String(opcoes.body)) : undefined;
    const requisicao = { metodo, caminho, query: url.searchParams, corpo };
    requisicoes.push(requisicao);

    const chave = `${metodo} ${caminho}`;
    if (!(chave in rotas)) {
      return Response.json({ erro: `rota não simulada no teste: ${chave}` }, { status: 404 });
    }
    const definida = rotas[chave];
    const resposta = typeof definida === "function" ? definida(requisicao) : definida;
    if (resposta instanceof RespostaDeErro) {
      return Response.json({ erro: resposta.erro }, { status: resposta.status });
    }
    return Response.json(resposta ?? {});
  });

  return {
    /** Requisições feitas para "MÉTODO /caminho", na ordem. */
    chamadas: (chave: string) => requisicoes.filter((r) => `${r.metodo} ${r.caminho}` === chave),
  };
}
