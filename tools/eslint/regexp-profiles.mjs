import regexp from 'eslint-plugin-regexp';

const sourceFiles = ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'];

const regexpRules = Object.fromEntries(
  Object.entries(regexp.configs['flat/all'].rules).map(([rule, severity]) => [
    rule,
    severity === 'warn' ? 'error' : severity,
  ]),
);

// The workspace targets ES2022. Unicode mode is supported by that target;
// Unicode-set mode (`v`) would require ES2024 output and a broader runtime
// baseline, so it is intentionally not a global requirement.
regexpRules['regexp/require-unicode-sets-regexp'] = 'off';

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
