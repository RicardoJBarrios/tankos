/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/tank-os/data-access-ui',
  plugins: [
    angular(),
    tsconfigPaths(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  resolve: {
    dedupe: [
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
    ],
  },
  test: {
    name: 'data-access-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
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
      reportsDirectory: '../../../coverage/libs/tank-os/data-access-ui',
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
