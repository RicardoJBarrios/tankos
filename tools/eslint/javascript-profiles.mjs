import globals from 'globals';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';

const javascriptFiles = ['**/*.{js,jsx,mjs,cjs}'];

/**
 * Creates the workspace JavaScript ESLint profile.
 *
 * JavaScript-family files are limited to tooling and configuration in this
 * repository. They use Nx's JavaScript preset and intentionally do not opt
 * into TypeScript project-service parsing.
 *
 * @returns The flat ESLint configuration for JavaScript-family files.
 */
export function createJavaScriptEslintConfig() {
  return [
    ...nx.configs['flat/javascript'],
    {
      ...js.configs.all,
      files: javascriptFiles,
      languageOptions: {
        globals: globals.node,
      },
      rules: {
        // The workspace guardrail deliberately keeps named functions as
        // declarations; these stylistic presets must not contradict it.
        'func-style': 'off',
        'one-var': 'off',
      },
    },
  ];
}
