/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/tank-os/data-access',
  plugins: [
    angular(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  resolve: { tsconfigPaths: true },
  test: {
    name: 'data-access',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/tank-os/data-access',
      provider: 'v8' as const,
      exclude: [
        'vite.config.mts',
        'src/lib/core/ports/*.ts',
        'src/lib/core/value-types/batch-result.ts',
        'src/lib/core/value-types/batch-scope.ts',
        'src/lib/core/value-types/crud-record.ts',
        'src/lib/core/value-types/crud-request.ts',
        'src/lib/core/value-types/record-metadata.ts',
        'src/lib/core/value-types/versioning.ts',
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
