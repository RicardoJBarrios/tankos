/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/data-access-firestore-admin',
  plugins: [tsconfigPaths()],
  // Uncomment this if you are using workers.
  test: {
    name: 'data-access-firestore-admin',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    ...createVitestReporting('data-access-firestore-admin', '../../'),
    coverage: {
      ...createVitestReporting('data-access-firestore-admin', '../../')
        .coverage,
      reportsDirectory: '../../coverage/libs/data-access-firestore-admin',
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
