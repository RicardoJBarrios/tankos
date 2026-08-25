import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    allowOnly: false,
    projects: [
      '**/vite.config.{mjs,js,ts,mts}',
      '**/vitest.config.{mjs,js,ts,mts}',
    ],
  },
});
