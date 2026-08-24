/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/units-firestore',
  plugins: [
    tsconfigPaths(),
    viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }),
  ],
  test: {
    name: 'units-firestore',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    ...createVitestReporting('units-firestore', '../../'),
    coverage: {
      ...createVitestReporting('units-firestore', '../../').coverage,
      reportsDirectory: '../../coverage/libs/units-firestore',
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
