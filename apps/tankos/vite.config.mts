/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/tankos',
  plugins: [angular()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@tankos/formatting': resolve(
        __dirname,
        '../../libs/formatting/src/index.ts',
      ),
      '@tankos/time': resolve(__dirname, '../../libs/time/src/index.ts'),
    },
  },
  test: {
    name: 'tankos',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('tankos', '../../'),
    coverage: {
      ...createVitestReporting('tankos', '../../').coverage,
      reportsDirectory: '../../coverage/apps/tankos',
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
