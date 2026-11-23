import {
  createTheme,
  defaultVariantColorsResolver,
  parseThemeColor,
  type CSSVariablesResolver,
  type VariantColorsResolver,
} from "@mantine/core";

export const AZUL_COOPERSIGN = "#004b68";
export const AMARELO_COOPERSIGN = "#fff112";

// As cores padrao do Mantine (verde, amarelo, laranja, vermelho...) ficam abaixo do contraste
// de 4,5:1 da WCAG 2.1 AA em texto pequeno. Nas etiquetas e botoes coloridos, o texto e o fundo
// cheio usam a cor escurecida em 30%. O azul da Coopersign ja passa e fica como esta.
const escurecer = (cor: string) => `color-mix(in srgb, ${cor} 70%, black)`;

export const coresComContraste: VariantColorsResolver = (entrada) => {
  const padrao = defaultVariantColorsResolver(entrada);
  const cor = parseThemeColor({ color: entrada.color ?? entrada.theme.primaryColor, theme: entrada.theme });
  if (!cor.isThemeColor || cor.shade !== undefined || cor.color === entrada.theme.primaryColor) {
    return padrao;
  }
  const tom = (n: number) => `var(--mantine-color-${cor.color}-${n})`;
  if (entrada.variant === "filled") {
    return { ...padrao, background: escurecer(tom(8)), hover: escurecer(tom(9)) };
  }
  if (entrada.variant === "light" || entrada.variant === "subtle" || entrada.variant === "outline") {
    return { ...padrao, color: escurecer(tom(9)) };
  }
  return padrao;
};

export const tema = createTheme({
  primaryColor: "coopersign",
  primaryShade: 6,
  variantColorResolver: coresComContraste,
  colors: {
    coopersign: [
      "#e6f3f8",
      "#cde5ee",
      "#9ccbdc",
      "#68b0c9",
      "#3a93b1",
      "#1a7896",
      AZUL_COOPERSIGN,
      "#004159",
      "#00364a",
      "#002a3a",
    ],
  },
});

// O cinza padrao do Mantine para texto secundario (#868e96) tem contraste 3,3:1 com o branco.
// Este cinza passa tambem sobre as linhas listradas das tabelas.
export const variaveisCss: CSSVariablesResolver = () => ({
  variables: {},
  light: { "--mantine-color-dimmed": "#5f666d" },
  dark: {},
});
