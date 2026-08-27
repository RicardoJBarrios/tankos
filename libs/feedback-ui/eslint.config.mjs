import { createAngularEslintConfig } from '../../tools/eslint/angular-profiles.mjs';
import { createVitestEslintConfig } from '../../tools/eslint/vitest-profiles.mjs';

export default [
  ...createAngularEslintConfig({ prefix: 'tankos' }),
  ...createVitestEslintConfig(),
];
