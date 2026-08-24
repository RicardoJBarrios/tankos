/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/decimal',
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@tankos/decimal': resolve(__dirname, 'src/index.ts'),
      '@tankos/decimal-big-js': resolve(
        __dirname,
        '../decimal-big-js/src/index.ts',
      ),
    },
  },
  test: {
    name: 'decimal',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('decimal', '../../'),
    coverage: {
      ...createVitestReporting('decimal', '../../').coverage,
      reportsDirectory: '../../coverage/libs/decimal',
      provider: 'v8' as const,
      // Type-only contracts have no executable behavior to measure.
      exclude: [
        '**/*.config.*',
        '**/test-setup.ts',
        'src/lib/decimal/core/ports/**',
        'src/lib/decimal/core/value-types/decimal.ts',
      ],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
}));
