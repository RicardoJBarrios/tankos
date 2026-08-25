import vitest from 'eslint-plugin-vitest';

const vitestTestFiles = ['**/*.{spec,test}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'];

const customTestBlockFunctions = ['emulatorTest'];
const customAssertionFunctions = ['expect', 'expectCode'];

/**
 * Creates the reusable Vitest ESLint profile.
 *
 * Playwright files under an application's `e2e` directory are excluded so
 * they can receive the Playwright profile without two test-framework rule
 * sets competing over the same source file.
 *
 * @returns The flat ESLint configuration for Vitest tests.
 */
export function createVitestEslintConfig() {
  return [
    {
      files: vitestTestFiles,
      ignores: ['**/e2e/**'],
      languageOptions: vitest.configs.env.languageOptions,
      plugins: { vitest },
      rules: {
        ...vitest.configs.recommended.rules,
        'vitest/no-disabled-tests': 'error',
        'vitest/no-focused-tests': 'error',
        'vitest/expect-expect': [
          'error',
          {
            additionalTestBlockFunctions: customTestBlockFunctions,
            assertFunctionNames: customAssertionFunctions,
          },
        ],
        'vitest/no-standalone-expect': [
          'error',
          { additionalTestBlockFunctions: customTestBlockFunctions },
        ],
        'vitest/no-identical-title': 'error',
      },
    },
  ];
}
