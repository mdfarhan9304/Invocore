import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".agents/**",
      ".git/**",
      ".next/**",
      "build/**",
      "coverage/**",
      "dist/**",
      "node_modules/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error"
    }
  },
  eslintConfigPrettier
];
