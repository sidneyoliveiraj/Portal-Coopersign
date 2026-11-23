import { describe, expect, it } from "vitest";
import { mergeMantineTheme, DEFAULT_THEME } from "@mantine/core";
import { coresComContraste, tema } from "./tema";

const temaCompleto = mergeMantineTheme(DEFAULT_THEME, tema);
const cores = (color: string, variant: string) => coresComContraste({ color, variant, theme: temaCompleto });

describe("cores com contraste (WCAG 2.1 AA)", () => {
  it("escurece o texto das etiquetas coloridas", () => {
    expect(cores("green", "light").color).toBe("color-mix(in srgb, var(--mantine-color-green-9) 70%, black)");
    expect(cores("red", "subtle").color).toBe("color-mix(in srgb, var(--mantine-color-red-9) 70%, black)");
  });

  it("escurece o fundo dos botoes cheios coloridos", () => {
    expect(cores("red", "filled").background).toBe("color-mix(in srgb, var(--mantine-color-red-8) 70%, black)");
  });

  it("mantem o azul da Coopersign e os tons escolhidos a mao", () => {
    expect(cores("coopersign", "filled").background).toBe("var(--mantine-color-coopersign-filled)");
    expect(cores("red.9", "light").color).not.toContain("color-mix");
  });
});
