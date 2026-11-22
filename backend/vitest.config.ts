import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    env: { LIMITES_DESLIGADOS: "1" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/generated/**", "src/server.ts", "src/types/**"],
      reporter: ["text-summary", "text", "html", "lcov"],
      thresholds: { lines: 75 },
    },
  },
});
