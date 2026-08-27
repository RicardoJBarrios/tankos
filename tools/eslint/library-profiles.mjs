import baseConfig from '../../eslint.config.mjs';

import { createVitestEslintConfig } from './vitest-profiles.mjs';

/**
 * Creates the shared ESLint profile for framework-independent libraries.
 *
 * Angular libraries use `createAngularEslintConfig`; libraries without Angular
 * use this profile so project configs never import the root composition
 * directly. Vitest remains opt-in because not every package owns tests.
 *
 * @param {{ withVitest?: boolean }} [options] Profile options.
 * @returns {import('eslint').Linter.Config[]} Flat ESLint configuration.
 */
export function createLibraryEslintConfig({ withVitest = true } = {}) {
  return [...baseConfig, ...(withVitest ? createVitestEslintConfig() : [])];
}
