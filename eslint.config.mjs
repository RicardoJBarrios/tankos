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
    files: ['libs/**/src/**/*.ts'],
    plugins: { sonarjs },
    rules: {
      complexity: ['error', 10],
      'sonarjs/cognitive-complexity': ['error', 15],
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
