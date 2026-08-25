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

const duplicatedStylisticRules = new Set([
  '@typescript-eslint/prefer-includes',
  '@typescript-eslint/prefer-nullish-coalescing',
  '@typescript-eslint/prefer-regexp-exec',
]);

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
 * Keeps stylistic TypeScript rules that are not already owned by another
 * workspace quality profile.
 *
 * @param config The stylistic preset object to filter.
 * @returns The preset object without duplicated rules.
 */
function scopeNonDuplicatedStylisticPreset(config) {
  return {
    ...scopeTypedPreset(config),
    rules: Object.fromEntries(
      Object.entries(config.rules ?? {}).filter(
        ([ruleName]) => !duplicatedStylisticRules.has(ruleName),
      ),
    ),
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
    ...tseslint.configs.stylisticTypeChecked.map(
      scopeNonDuplicatedStylisticPreset,
    ),
    {
      files: typedTypeScriptFiles,
      languageOptions: {
        parserOptions: typedParserOptions,
      },
    },
  ];
}
