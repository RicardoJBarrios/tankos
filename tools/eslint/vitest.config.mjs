import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tools/eslint/**/*.spec.mjs'],
  },
});
