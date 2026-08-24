/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/time',
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@tankos/formatting': resolve(__dirname, '../formatting/src/index.ts'),
      '@tankos/time': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    name: 'time',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('time', '../../'),
    coverage: {
      ...createVitestReporting('time', '../../').coverage,
      reportsDirectory: '../../coverage/libs/time',
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
