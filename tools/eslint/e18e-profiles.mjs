import e18e from '@e18e/eslint-plugin';

const sourceFiles = ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'];

const compatibleRuleNames = [
  'e18e/ban-dependencies',
  'e18e/prefer-array-fill',
  'e18e/prefer-array-from-map',
  'e18e/prefer-array-some',
  'e18e/prefer-date-now',
  'e18e/prefer-includes',
  'e18e/prefer-nullish-coalescing',
  'e18e/prefer-spread-syntax',
  'e18e/prefer-static-regex',
  'e18e/prefer-string-fromcharcode',
  'e18e/prefer-timer-args',
];

const compatibleRules = Object.fromEntries(
  Object.entries(e18e.configs.recommended.rules).filter(([ruleName]) =>
    compatibleRuleNames.includes(ruleName),
  ),
);

/**
 * Creates the strict e18e modernization and performance profile.
 *
 * Rules requiring APIs newer than the workspace runtime target are excluded
 * deliberately. The selected rules are not duplicated by Nx, Sheriff,
 * SonarJS, TypeScript ESLint or the regular-expression profile.
 *
 * @returns The flat ESLint configuration for e18e rules.
 */
export function createE18eEslintConfig() {
  return [
    {
      files: sourceFiles,
      plugins: { e18e },
      rules: compatibleRules,
    },
  ];
}
