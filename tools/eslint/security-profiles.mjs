import security from 'eslint-plugin-security';

const serverAndToolingFiles = [
  'tools/**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}',
  'libs/data-access-server/**/*.{ts,tsx,cts,mts}',
  'libs/data-access-firestore-admin/**/*.{ts,tsx,cts,mts}',
  'apps/*/server/**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}',
];

const securityRules = Object.fromEntries(
  Object.entries(security.configs.recommended.rules).map(([rule, severity]) => [
    rule,
    severity === 'warn' ? 'error' : severity,
  ]),
);

/**
 * Creates the strict security profile for server-side and tooling code.
 *
 * Browser UI code is deliberately excluded because several rules inspect
 * Node-oriented APIs and otherwise produce noise in Angular templates and
 * client-side code.
 *
 * @returns The flat ESLint configuration for server and tooling files.
 */
export function createSecurityEslintConfig() {
  return [
    {
      files: serverAndToolingFiles,
      plugins: { security },
      rules: securityRules,
    },
  ];
}
