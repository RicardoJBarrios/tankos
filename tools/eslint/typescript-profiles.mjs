import { fileURLToPath } from 'node:url';

import nx from '@nx/eslint-plugin';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

const typedTypeScriptFiles = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.cts',
  '**/*.mts',
];

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
    {
      files: typedTypeScriptFiles,
      languageOptions: {
        parserOptions: typedParserOptions,
      },
    },
  ];
}
