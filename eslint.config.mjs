import { createE18eEslintConfig } from './tools/eslint/e18e-profiles.mjs';
import { createJavaScriptEslintConfig } from './tools/eslint/javascript-profiles.mjs';
import { createRegexpEslintConfig } from './tools/eslint/regexp-profiles.mjs';
import { createSecurityEslintConfig } from './tools/eslint/security-profiles.mjs';
import { createTSDocEslintConfig } from './tools/eslint/tsdoc-profiles.mjs';
import { createTypeScriptEslintConfig } from './tools/eslint/typescript-profiles.mjs';
import { createWorkspaceEslintConfig } from './tools/eslint/workspace-profiles.mjs';

export default [
  ...createWorkspaceEslintConfig(),
  ...createE18eEslintConfig(),
  ...createTypeScriptEslintConfig(),
  ...createJavaScriptEslintConfig(),
  ...createRegexpEslintConfig(),
  ...createSecurityEslintConfig(),
  ...createTSDocEslintConfig(),
  {
    ignores: ['**/vitest.config.*.timestamp*'],
  },
];
