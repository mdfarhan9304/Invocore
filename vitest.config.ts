import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"]
    },
    environment: "node",
    globals: true,
    include: [
      "apps/**/*.test.ts",
      "apps/**/*.spec.ts",
      "packages/**/*.test.ts",
      "packages/**/*.spec.ts"
    ]
  }
});
