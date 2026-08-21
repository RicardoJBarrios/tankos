/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/tank-os/time',
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@tank-os/time': resolve(__dirname, 'src/index.ts'),
      '@tank-os/time/firestore': resolve(__dirname, 'firestore/index.ts'),
      '@tank-os/time/json-http': resolve(__dirname, 'json-http/index.ts'),
      '@tank-os/time/zod': resolve(__dirname, 'zod/index.ts'),
    },
  },
  test: {
    name: 'time',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests,firestore,json-http,zod}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/tank-os/time',
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
