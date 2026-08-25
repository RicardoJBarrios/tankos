import baseConfig from '../../eslint.config.mjs';
import { createAngularEslintConfig } from '../../tools/eslint/angular-profiles.mjs';
import { createPlaywrightEslintConfig } from '../../tools/eslint/playwright-profiles.mjs';
import { createVitestEslintConfig } from '../../tools/eslint/vitest-profiles.mjs';

export default [
  ...baseConfig,
  ...createAngularEslintConfig({ prefix: 'veril' }),
  ...createVitestEslintConfig(),
  ...createPlaywrightEslintConfig(),
];
