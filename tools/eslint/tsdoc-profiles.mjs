import tsdoc from 'eslint-plugin-tsdoc';

const typeScriptFiles = ['**/*.{ts,tsx,cts,mts}'];

/**
 * Creates the TSDoc syntax profile.
 *
 * TSDoc syntax validation is kept separate from documentation coverage rules;
 * this profile validates comments that exist without inventing a public API
 * policy for every internal implementation detail.
 *
 * @returns The flat ESLint configuration for TSDoc comments.
 */
export function createTSDocEslintConfig() {
  return [
    {
      files: typeScriptFiles,
      plugins: { tsdoc },
      rules: {
        'tsdoc/syntax': 'error',
      },
    },
  ];
}
