import reactRefresh from "eslint-plugin-react-refresh"
import js from "@eslint/js"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"
import prettier from "eslint-plugin-prettier/recommended"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import runePlugin from "rune-sdk/eslint.js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import pluginReactThree from "@react-three/eslint-plugin"

export default [
  {
    ignores: ["node_modules/", "dist/", "pnpm-lock.yaml", ".wrangler/"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "react-refresh": reactRefresh,
      "react-hooks": reactHooks,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  js.configs.recommended,
  ...runePlugin.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    rules: pluginReactHooks.configs.recommended.rules,
  },
  prettier,
  {
    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["args", "intensity", "position", "rotation", "scale", "geometry", "material"],
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
  {
    plugins: {
      "@react-three": pluginReactThree,
    },
    rules: pluginReactThree.configs.recommended.rules,
  },
]
