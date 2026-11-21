import { describe, it, expect } from "vitest";
import { enderecoDoServidor } from "./tempoReal";

describe("enderecoDoServidor", () => {
  it("em desenvolvimento usa o endereco da API sem o /api", () => {
    expect(enderecoDoServidor("http://localhost:3000/api", "http://localhost:5173")).toBe("http://localhost:3000");
  });

  it("em producao, com a API relativa, usa o proprio site", () => {
    expect(enderecoDoServidor("/api", "https://coopersign.exemplo.com")).toBe("https://coopersign.exemplo.com");
  });
});
