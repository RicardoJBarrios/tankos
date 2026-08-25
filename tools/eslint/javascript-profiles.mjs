import nx from '@nx/eslint-plugin';

/**
 * Creates the workspace JavaScript ESLint profile.
 *
 * JavaScript-family files are limited to tooling and configuration in this
 * repository. They use Nx's JavaScript preset and intentionally do not opt
 * into TypeScript project-service parsing.
 *
 * @returns The flat ESLint configuration for JavaScript-family files.
 */
export function createJavaScriptEslintConfig() {
  return [...nx.configs['flat/javascript']];
}
