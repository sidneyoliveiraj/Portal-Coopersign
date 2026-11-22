import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { simularApi } from "../testes/apiFalsa";
import { logado, renderizarApp } from "../testes/renderizar";
import { clientes, materiais, servicos, umPedido } from "../testes/dados";

const semNbsp = (texto: string | null) => (texto ?? "").replace(/\s/g, " ");

function apiDoNovoPedido() {
  return simularApi({
    ...logado("GESTOR"),
    "GET /clientes": { clientes },
    "GET /materiais": { materiais },
    "GET /servicos-adicionais": { servicosAdicionais: servicos },
    "POST /pedidos": { pedido: { id: "p-9" } },
    "GET /pedidos/p-9": { pedido: umPedido({ id: "p-9" }) },
  });
}

async function escolher(usuario: UserEvent, campo: RegExp, opcao: RegExp) {
  await usuario.click(screen.getByRole("textbox", { name: campo }));
  await usuario.click(await screen.findByRole("option", { name: opcao }));
}

function valorNoResumo(rotulo: string) {
  const linha = screen.getByText(rotulo).parentElement!;
  return semNbsp(linha.textContent).replace(rotulo, "");
}

describe("Novo pedido (RF05, RF08, RF09, RN16)", () => {
  it("calcula na hora e cobra o mínimo de 1 m² por unidade", async () => {
    apiDoNovoPedido();
    const usuario = renderizarApp("/pedidos/novo");
    await screen.findByRole("heading", { name: "Novo pedido" });

    await escolher(usuario, /Material/, /^Adesivo brilho 106/);
    await usuario.type(screen.getByRole("textbox", { name: /Largura/ }), "104,1");
    await usuario.type(screen.getByRole("textbox", { name: /Altura/ }), "93,5");

    expect(valorNoResumo("Metragem")).toBe("0,97 m²");
    expect(valorNoResumo("Cobrado (mínimo 1 m² por unidade)")).toBe("1,00 m²");
    expect(valorNoResumo("Total")).toBe("R$ 29,00");
  });

  it("soma serviços adicionais ao total (RF10)", async () => {
    apiDoNovoPedido();
    const usuario = renderizarApp("/pedidos/novo");
    await screen.findByRole("heading", { name: "Novo pedido" });

    await escolher(usuario, /Material/, /^Lona fosca 120/);
    await usuario.type(screen.getByRole("textbox", { name: /Largura/ }), "200");
    await usuario.type(screen.getByRole("textbox", { name: /Altura/ }), "100");
    await usuario.click(screen.getByPlaceholderText("Escolha um serviço"));
    await usuario.click(await screen.findByRole("option", { name: /^Ilhós/ }));
    await usuario.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(valorNoResumo("Valor base")).toBe("R$ 90,00");
    expect(valorNoResumo("Serviços")).toBe("R$ 10,00");
    expect(valorNoResumo("Total")).toBe("R$ 100,00");
  });

  it("preenche cliente, material, quantidade e medidas pelo nome do arquivo (RF06)", async () => {
    apiDoNovoPedido();
    const usuario = renderizarApp("/pedidos/novo");
    await screen.findByRole("heading", { name: "Novo pedido" });
    await screen.findByText("Ler dados do arquivo");

    const nome = "Cliente GRAFICA AURORA_ADESIVO BRILHO 106_Quantidade 2x_Medida 119,7 x 35,6cm_CooperSign.cdr";
    const seletor = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await usuario.upload(seletor, new File(["sem conteudo"], nome));

    expect(await screen.findByText(/medidas do nome do arquivo/)).toHaveTextContent(
      "Do nome: cliente, material, quantidade.",
    );
    expect(screen.getByRole("textbox", { name: /Cliente/ })).toHaveValue("Gráfica Aurora");
    expect(semNbsp((screen.getByRole("textbox", { name: /Material/ }) as HTMLInputElement).value)).toBe(
      "Adesivo brilho 106 (R$ 29,00/m²)",
    );
    expect(screen.getByRole("textbox", { name: /Largura/ })).toHaveValue("119,7");
    expect(screen.getByRole("textbox", { name: /Altura/ })).toHaveValue("35,6");
    expect(screen.getByRole("textbox", { name: /Quantidade/ })).toHaveValue("2");
    expect(screen.getByRole("textbox", { name: /Referência do arquivo/ })).toHaveValue(nome);
  });

  it("pede confirmação e envia o pedido em metros, com a referência do arquivo", async () => {
    const api = apiDoNovoPedido();
    const usuario = renderizarApp("/pedidos/novo");
    await screen.findByRole("heading", { name: "Novo pedido" });

    await escolher(usuario, /Cliente/, /Gráfica Aurora/);
    await escolher(usuario, /Material/, /^Adesivo brilho 106/);
    await usuario.type(screen.getByRole("textbox", { name: /Largura/ }), "104,1");
    await usuario.type(screen.getByRole("textbox", { name: /Altura/ }), "93,5");
    await usuario.type(screen.getByRole("textbox", { name: /Referência do arquivo/ }), "WhatsApp do cliente");
    fireEvent.change(screen.getByLabelText(/Prazo de entrega/), { target: { value: "2026-11-20" } });
    await usuario.click(screen.getByRole("button", { name: "Registrar pedido" }));

    const janela = await screen.findByRole("dialog");
    expect(semNbsp(janela.textContent)).toContain("Gráfica Aurora no valor de R$ 29,00");
    expect(api.chamadas("POST /pedidos")).toHaveLength(0);

    await usuario.click(within(janela).getByRole("button", { name: "Registrar" }));

    await screen.findByText(/Voltar|Pedidos/);
    expect(api.chamadas("POST /pedidos")[0].corpo).toMatchObject({
      clienteId: "c-1",
      materialId: "m-1",
      largura: 1.041,
      altura: 0.935,
      quantidade: 1,
      arquivoUrl: "WhatsApp do cliente",
      prazoEntrega: "2026-11-20",
      formaPagamento: "A_VISTA",
    });
  });
});
