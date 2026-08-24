/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/tank-os',
  plugins: [angular()],
  resolve: { tsconfigPaths: true },
  test: {
    name: 'tank-os',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('tank-os', '../../'),
    coverage: {
      ...createVitestReporting('tank-os', '../../').coverage,
      reportsDirectory: '../../coverage/apps/tank-os',
      provider: 'v8' as const,
    },
  },
}));
