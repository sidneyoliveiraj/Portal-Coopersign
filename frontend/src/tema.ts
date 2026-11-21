import { createTheme } from "@mantine/core";

export const AZUL_COOPERSIGN = "#004b68";
export const AMARELO_COOPERSIGN = "#fff112";

export const tema = createTheme({
  primaryColor: "coopersign",
  primaryShade: 6,
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
