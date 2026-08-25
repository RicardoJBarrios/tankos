import globals from 'globals';

const vitestTestFiles = ['**/*.{spec,test}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'];

/**
 * Creates the reusable Vitest ESLint profile.
 *
 * Playwright files under an application's `e2e` directory are excluded so
 * they can receive the Playwright profile without two test-framework rule
 * sets competing over the same source file.
 *
 * Vitest semantic linting is deliberately kept out of this profile. The
 * workspace uses Vitest's native runtime guard for focused tests, while the
 * shared TypeScript and JavaScript profiles enforce test code. This also
 * keeps the profile independent from a framework plugin whose ESLint peer
 * range would constrain future ESLint upgrades.
 *
 * @returns The flat ESLint configuration for Vitest tests.
 */
export function createVitestEslintConfig() {
  return [
    {
      files: vitestTestFiles,
      ignores: ['**/e2e/**'],
      languageOptions: { globals: globals.vitest },
      rules: {
        // Test doubles frequently implement Promise-returning ports with
        // synchronous in-memory behavior. The production profile still
        // requires every async implementation to await a real operation.
        '@typescript-eslint/require-await': 'off',
        // Vitest's assertion API intentionally receives methods detached from
        // their object (for example `expect(mock.method)`).
        '@typescript-eslint/unbound-method': 'off',
        // Vitest module mocks and Firebase SDK test doubles are intentionally
        // structural runtime values. Production adapters remain fully typed;
        // test fixtures must describe behavior without pretending to be the
        // provider's private SDK implementation.
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unnecessary-type-conversion': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.property.name='only']",
            message:
              'Focused tests are forbidden; Vitest must run the complete suite.',
          },
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.property.name='skip']",
            message:
              'Skipped tests are forbidden; encode the expected behavior or remove the test.',
          },
          {
            selector:
              "CallExpression[callee.type='Identifier'][callee.name=/^(xdescribe|xit|xtest)$/]",
            message:
              'Disabled test declarations are forbidden; encode the expected behavior or remove the test.',
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'node:test',
                message: 'Use Vitest APIs for workspace tests.',
              },
            ],
          },
        ],
      },
    },
  ];
}
