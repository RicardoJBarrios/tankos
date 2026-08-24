/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/formatting',
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  test: {
    name: 'formatting',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('formatting', '../../'),
    coverage: {
      ...createVitestReporting('formatting', '../../').coverage,
      reportsDirectory: '../../coverage/libs/formatting',
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
