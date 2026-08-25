import { fileURLToPath } from 'node:url';

import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

const typedTypeScriptFiles = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'];

const typedParserOptions = {
  projectService: {
    allowDefaultProject: [
      '*.config.ts',
      '*.config.mts',
      'apps/*/playwright.config.mts',
      'apps/*/vitest.integration.config.ts',
    ],
  },
  tsconfigRootDir: repositoryRoot,
};

/**
 * Restricts a typescript-eslint preset object to TypeScript-family files.
 *
 * @param config The preset object to scope.
 * @returns The preset object with an explicit TypeScript file selector.
 */
function scopeTypedPreset(config) {
  return {
    ...config,
    files: config.files ?? typedTypeScriptFiles,
  };
}

/**
 * Creates the workspace TypeScript ESLint profile.
 *
 * The profile contains only TypeScript's Nx preset and the mandatory typed
 * parser configuration. Workspace-wide rules and JavaScript support are
 * composed by their dedicated profiles.
 *
 * @returns The flat ESLint configuration for TypeScript files.
 */
export function createTypeScriptEslintConfig() {
  return [
    ...nx.configs['flat/typescript'],
    ...tseslint.configs.strictTypeChecked.map(scopeTypedPreset),
    {
      files: typedTypeScriptFiles,
      languageOptions: {
        parserOptions: typedParserOptions,
      },
    },
  ];
}
