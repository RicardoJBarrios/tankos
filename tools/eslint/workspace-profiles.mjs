import nx from '@nx/eslint-plugin';
import sheriff from '@softarc/eslint-plugin-sheriff';
import sonarjs from 'eslint-plugin-sonarjs';

const workspaceSourceFiles = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.cts',
  '**/*.mts',
  '**/*.js',
  '**/*.jsx',
];

const workspaceRules = {
  '@nx/enforce-module-boundaries': [
    'error',
    {
      enforceBuildableLibDependency: true,
      allow: [
        '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
        '^.*\\.spec\\.[cm]?[jt]s$',
        '^.*(?:vite|vitest)\\.config\\.[cm]?[jt]s$',
      ],
      depConstraints: [
        {
          sourceTag: 'scope:app',
          onlyDependOnLibsWithTags: ['scope:app', 'scope:shared'],
        },
        {
          sourceTag: 'scope:shared',
          onlyDependOnLibsWithTags: ['scope:shared', 'scope:tankos'],
        },
        {
          sourceTag: 'scope:tankos',
          onlyDependOnLibsWithTags: ['scope:tankos'],
        },
      ],
    },
  ],
};

const libraryQualityRules = {
  ...sonarjs.configs.recommended.rules,
  complexity: ['error', 10],
  'sonarjs/cognitive-complexity': ['error', 15],
  // Methods without instance state belong outside the class as functions.
  'class-methods-use-this': ['error', { exceptMethods: [] }],
  // AccessRole is a deliberate ubiquitous-language alias for a role string.
  'sonarjs/redundant-type-aliases': 'off',
  'no-restricted-syntax': [
    'error',
    {
      selector:
        'VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression',
      message:
        'Named functions assigned to variables must use function declarations; reserve arrows for returned or inline callbacks.',
    },
    {
      selector: 'FunctionDeclaration FunctionDeclaration',
      message:
        'Named functions must be declared at module scope; do not nest function declarations inside functions.',
    },
  ],
};

const librarySizeRules = {
  'max-lines': [
    'error',
    {
      max: 300,
      skipBlankLines: true,
      skipComments: true,
    },
  ],
  'max-lines-per-function': [
    'error',
    { max: 60, skipBlankLines: true, skipComments: true },
  ],
};

/**
 * Creates the shared workspace ESLint profile.
 *
 * This profile owns framework-independent Nx, Sheriff, SonarJS, dependency
 * boundary and library-size rules. Language-specific parsers and presets are
 * deliberately composed by the TypeScript and JavaScript profiles.
 *
 * @returns The flat ESLint configuration shared by workspace projects.
 */
export function createWorkspaceEslintConfig() {
  return [
    ...nx.configs['flat/base'],
    sheriff.configs.all,
    {
      ignores: [
        '**/dist',
        '**/vite.config.*.timestamp*',
        '**/vitest.config.*.timestamp*',
      ],
    },
    {
      files: workspaceSourceFiles,
      rules: workspaceRules,
    },
    {
      files: ['libs/**/*.ts'],
      ignores: ['**/*.spec.ts', '**/*.test.ts'],
      plugins: { sonarjs },
      rules: libraryQualityRules,
    },
    {
      files: ['libs/**/*.ts'],
      ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.config.ts'],
      rules: librarySizeRules,
    },
    {
      files: ['**/vite.config.*', '**/vitest.config.*'],
      rules: {
        // Tooling configs compose workspace-level utilities and do not belong
        // to the application/library dependency graph.
        '@nx/enforce-module-boundaries': 'off',
      },
    },
  ];
}
