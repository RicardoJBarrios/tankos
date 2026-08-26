import { createAngularEslintConfig } from '../../tools/eslint/angular-profiles.mjs';
import { createPlaywrightEslintConfig } from '../../tools/eslint/playwright-profiles.mjs';
import { createVitestEslintConfig } from '../../tools/eslint/vitest-profiles.mjs';

export default [
  ...createAngularEslintConfig({ prefix: 'tankos' }),
  ...createVitestEslintConfig(),
  ...createPlaywrightEslintConfig(),
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {},
  },
];
