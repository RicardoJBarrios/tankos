import { createJavaScriptEslintConfig } from './tools/eslint/javascript-profiles.mjs';
import { createTypeScriptEslintConfig } from './tools/eslint/typescript-profiles.mjs';
import { createWorkspaceEslintConfig } from './tools/eslint/workspace-profiles.mjs';

export default [
  ...createWorkspaceEslintConfig(),
  ...createTypeScriptEslintConfig(),
  ...createJavaScriptEslintConfig(),
];
