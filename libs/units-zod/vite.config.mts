/// <reference types='vitest' />
import { createVitestReporting } from '../../tools/testing/vitest-reporting';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/units-zod',
  resolve: { tsconfigPaths: true },
  plugins: [viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] })],
  test: {
    name: 'units-zod',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    ...createVitestReporting('units-zod', '../../'),
    coverage: {
      ...createVitestReporting('units-zod', '../../').coverage,
      reportsDirectory: '../../coverage/libs/units-zod',
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
