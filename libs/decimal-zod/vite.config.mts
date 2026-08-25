/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/decimal-zod',
  resolve: { tsconfigPaths: true },
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  test: {
    name: 'decimal-zod',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('decimal-zod', '../../'),
    coverage: {
      ...createVitestReporting('decimal-zod', '../../').coverage,
      reportsDirectory: '../../coverage/libs/decimal-zod',
      provider: 'v8' as const,
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
}));
