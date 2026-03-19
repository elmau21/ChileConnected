/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  ignorePatterns: ["node_modules/", "dist/", ".next/", "playwright-report/", "test-results/"],
  extends: ["eslint:recommended"],
};

