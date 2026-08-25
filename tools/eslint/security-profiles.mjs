import security from 'eslint-plugin-security';

const toolingFiles = ['tools/**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'];

const securityRules = Object.fromEntries(
  Object.entries(security.configs.recommended.rules).map(([rule, severity]) => [
    rule,
    severity === 'warn' ? 'error' : severity,
  ]),
);

/**
 * Creates the strict security profile for tooling code.
 *
 * Browser UI code is deliberately excluded because several rules inspect
 * Node-oriented APIs and otherwise produce noise in Angular templates and
 * client-side code.
 *
 * @returns The flat ESLint configuration for tooling files.
 */
export function createSecurityEslintConfig() {
  return [
    {
      files: toolingFiles,
      plugins: { security },
      rules: securityRules,
    },
  ];
}
