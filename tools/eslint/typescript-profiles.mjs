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
      'tools/testing/vitest-reporting.ts',
    ],
  },
  tsconfigRootDir: repositoryRoot,
};

const duplicatedStylisticRules = new Set([
  '@typescript-eslint/prefer-includes',
  '@typescript-eslint/prefer-nullish-coalescing',
  '@typescript-eslint/prefer-regexp-exec',
]);

// These public boundary functions intentionally accept malformed runtime
// values even though their TypeScript contracts describe validated values.
// Their null/object guards are therefore meaningful at runtime.
const runtimeValidationFiles = [
  '**/core/value-types/access-context.ts',
  '**/core/value-types/batch-operation.ts',
  '**/firestore/firestore-local-cache.ts',
  '**/firestore-admin-batch-store-context.ts',
  '**/firestore-admin-batch-store-leases-operations.ts',
  '**/native-local-date-arithmetic.ts',
  '**/native-time-interval.ts',
  '**/core/value-types/conversion-definition.ts',
  '**/core/value-types/unit-definition.ts',
  '**/core/value-types/unit-representation.ts',
];

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
    {
      files: runtimeValidationFiles,
      rules: { '@typescript-eslint/no-unnecessary-condition': 'off' },
    },
  ];
}
