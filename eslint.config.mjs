import nx from '@nx/eslint-plugin';
import sheriff from '@softarc/eslint-plugin-sheriff';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  sheriff.configs.all,
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            '^.*\\.spec\\.[cm]?[jt]s$',
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
    },
  },
  {
    files: ['libs/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs.recommended.rules,
      complexity: ['error', 10],
      'sonarjs/cognitive-complexity': ['error', 15],
      // Methods without instance state belong outside the class as functions.
      'class-methods-use-this': ['error', { exceptMethods: [] }],
      // AccessRole is a deliberate ubiquitous-language alias for a role string.
      // The rule cannot distinguish that semantic contract from a redundant alias.
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
    },
  },
  {
    files: ['libs/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.config.ts'],
    rules: {
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
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
