/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/data-access-ui',
  resolve: {
    tsconfigPaths: true,
    dedupe: [
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
    ],
  },
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  test: {
    name: 'data-access-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('data-access-ui', '../../'),
    server: {
      deps: {
        inline: [
          '@angular/core',
          '@angular/common',
          '@angular/compiler',
          '@angular/platform-browser',
          '@angular/platform-browser-dynamic',
          '@ngneat/spectator',
        ],
      },
    },
    coverage: {
      ...createVitestReporting('data-access-ui', '../../').coverage,
      reportsDirectory: '../../coverage/libs/data-access-ui',
      provider: 'v8' as const,
      include: [
        'src/index.ts',
        'src/lib/crud-list/crud-list-store.ts',
        'src/lib/crud-list/crud-list.component.ts',
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
