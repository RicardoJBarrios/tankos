import playwright from 'eslint-plugin-playwright';

const playwrightTestFiles = [
  'apps/**/e2e/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}',
];

/**
 * Creates the reusable Playwright ESLint profile.
 *
 * The profile is limited to application E2E suites. Unit and integration
 * tests remain under the Vitest profile even when they use browser-like
 * Angular test environments.
 *
 * @returns The flat ESLint configuration for Playwright tests.
 */
export function createPlaywrightEslintConfig() {
  return [
    {
      files: playwrightTestFiles,
      ...playwright.configs['flat/recommended'],
      rules: {
        ...playwright.configs['flat/recommended'].rules,
        'playwright/no-focused-test': 'error',
        'playwright/no-skipped-test': 'error',
      },
    },
  ];
}
