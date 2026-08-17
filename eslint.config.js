/**
 * ESLint configuration (flat config).
 * See: https://eslint.org/docs/latest/use/configure/configuration-files
 */

const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const prettierConfig = require("eslint-config-prettier");

// Files that run in the browser via Gatsby's client bundle (React/JSX).
const reactFiles = ["src/**/*.js", "gatsby-browser.js"];

module.exports = [
  {
    ignores: ["public/**", ".cache/**", "infrastructure/**", ".impeccable/**"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
    },
  },
  {
    // gatsby-config.js, data/siteConfig.js and this file itself run in
    // Node at build/config time (CommonJS), not in the browser bundle.
    files: ["gatsby-config.js", "eslint.config.js", "data/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: reactFiles,
    ...react.configs.flat.recommended,
  },
  {
    files: reactFiles,
    ...jsxA11y.flatConfigs.recommended,
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Off by default upstream (false-positive risk in some setups), but
      // Gatsby's own build-time linter enables it and it already caught a
      // real issue here (icon-only social links with no accessible name).
      "jsx-a11y/control-has-associated-label": "warn",
    },
  },
  {
    // Only the classic hook-correctness rules, not the wider React Compiler
    // rule bundle that eslint-plugin-react-hooks now ships in `recommended`.
    files: reactFiles,
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: reactFiles,
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Must stay last: turns off stylistic rules that conflict with Prettier.
  prettierConfig,
];
