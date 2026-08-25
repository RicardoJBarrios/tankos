import baseConfig from '../../eslint.config.mjs';
import { createVitestEslintConfig } from '../../tools/eslint/vitest-profiles.mjs';

export default [
  ...baseConfig,
  ...createVitestEslintConfig(),
  {
    files: [
      'src/lib/adapters/memory/**/*.ts',
      'src/lib/adapters/cache/ttl-cache.ts',
    ],
    rules: {
      // These adapters intentionally expose synchronous state through the
      // Promise-returning ports used by remote adapters.
      '@typescript-eslint/require-await': 'off',
    },
  },
];
