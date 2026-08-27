import { createLibraryEslintConfig } from '../../tools/eslint/library-profiles.mjs';

export default [
  ...createLibraryEslintConfig(),
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
