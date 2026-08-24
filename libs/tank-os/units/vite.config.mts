/// <reference types='vitest' />
import { createVitestReporting } from '../../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/tank-os/units',
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@tank-os/decimal-big-js': resolve(
        __dirname,
        '../decimal-big-js/src/index.ts',
      ),
      '@tank-os/decimal': resolve(__dirname, '../decimal/src/index.ts'),
      '@tank-os/data-access': resolve(__dirname, '../data-access/src/index.ts'),
    },
  },
  test: {
    name: 'units',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('units', '../../../'),
    coverage: {
      ...createVitestReporting('units', '../../../').coverage,
      reportsDirectory: '../../../coverage/libs/tank-os/units',
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
