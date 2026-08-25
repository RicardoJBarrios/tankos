import regexp from 'eslint-plugin-regexp';

const sourceFiles = ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'];

const regexpRules = Object.fromEntries(
  Object.entries(regexp.configs['flat/all'].rules).map(([rule, severity]) => [
    rule,
    severity === 'warn' ? 'error' : severity,
  ]),
);

/**
 * Creates the strict regular-expression profile.
 *
 * The plugin's complete preset is promoted to errors so questionable or
 * inefficient patterns cannot enter the workspace silently.
 *
 * @returns The flat ESLint configuration for regular expressions.
 */
export function createRegexpEslintConfig() {
  return [
    {
      files: sourceFiles,
      plugins: { regexp },
      rules: regexpRules,
    },
  ];
}
