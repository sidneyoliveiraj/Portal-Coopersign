import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testes/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Datas e horas como na Coopersign, em qualquer máquina (inclusive no GitHub Actions).
    env: { TZ: "America/Sao_Paulo" },
    coverage: {
      provider: "v8",
      // Mede o src inteiro, não só os arquivos que os testes abrem.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/testes/**", "src/main.tsx", "src/vite-env.d.ts", "src/tipos.ts"],
      reporter: ["text-summary", "text", "html", "lcov"],
      thresholds: { lines: 25 },
    },
  },
});
