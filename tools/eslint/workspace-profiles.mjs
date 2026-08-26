import nx from '@nx/eslint-plugin';
import aiGuard from 'eslint-plugin-ai-guard';
import boundaries from 'eslint-plugin-boundaries';
import essential from 'eslint-plugin-essential';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

import localRules from './local-rules.mjs';

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

const aiGuardPlugin = aiGuard.default ?? aiGuard;

const libraryQualityRules = {
  ...aiGuardPlugin.configs.strict.rules,
  ...sonarjs.configs.recommended.rules,
  complexity: ['error', 10],
  'sonarjs/cognitive-complexity': ['error', 15],
  'essential/max-nested-conditions': ['error', { maxDepth: 1 }],
  'unicorn/no-nested-ternary': 'error',
  'unicorn/no-boolean-sort-comparator': 'error',
  'unicorn/no-double-comparison': 'error',
  'unicorn/no-duplicate-logical-operands': 'error',
  'unicorn/no-error-property-assignment': 'error',
  'unicorn/no-impossible-length-comparison': 'error',
  'unicorn/no-multiple-promise-resolver-calls': 'error',
  'unicorn/no-redundant-comparison': 'error',
  'unicorn/no-unsafe-promise-all-settled-values': 'error',
  'unicorn/no-unnecessary-await': 'error',
  'unicorn/throw-new-error': 'error',
  'unicorn/error-message': 'error',
  'unicorn/prefer-simplified-conditions': 'error',
  'unicorn/prefer-simple-condition-first': 'error',
  'tankos/no-multiple-comparisons-in-condition': [
    'error',
    { maxConditionTerms: 2 },
  ],
  'tankos/no-consecutive-same-return-guards': 'error',
  // Methods without instance state belong outside the class as functions.
  'class-methods-use-this': ['error', { exceptMethods: [] }],
  // AccessRole is a deliberate ubiquitous-language alias for a role string.
  'sonarjs/redundant-type-aliases': 'off',
  // SonarJS does not recognise named groups consumed through `match.groups`;
  // the workspace intentionally uses that typed access pattern.
  'sonarjs/unused-named-groups': 'off',
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

const intentionallyPromiseShapedAdapters = [
  '**/memory-batch-operation-implementation.ts',
  '**/memory-crud-repository-implementation.ts',
  '**/firestore-crud-repository-policy.ts',
  '**/firestore-crud-repository-implementation.ts',
  '**/json-http-crud-repository-implementation.ts',
  '**/mapped-firestore-crud-repository.ts',
];

const architecturalElements = [
  { type: 'core', pattern: 'libs/authn/src/lib/core/*' },
  { type: 'composition', pattern: 'libs/authn/src/lib/composition/*' },
  { type: 'adapters', pattern: 'libs/authn/src/lib/adapters/*' },
  { type: 'core', pattern: 'libs/*/src/lib/*/core/*' },
  { type: 'application', pattern: 'libs/*/src/lib/*/application/*' },
  { type: 'adapters', pattern: 'libs/*/src/lib/*/adapters/*' },
  { type: 'adapters', pattern: 'libs/*/src/lib/firestore/*' },
  { type: 'adapters', pattern: 'libs/*/src/lib/zod/*' },
  { type: 'composition', pattern: 'libs/*/src/lib/*/composition/*' },
  { type: 'presentation', pattern: 'libs/*/src/lib/*/presentation/*' },
  { type: 'presentation', pattern: 'libs/data-access-ui/src/lib/*' },
  { type: 'presentation', pattern: 'libs/*/src/lib/*-ui/*' },
  { type: 'core', pattern: 'libs/data-access/src/*' },
];

const architecturalPolicies = [
  {
    from: { element: { type: 'core' } },
    allow: { to: { element: { types: { anyOf: ['core'] } } } },
  },
  {
    from: { element: { type: 'application' } },
    allow: {
      to: {
        element: { types: { anyOf: ['core', 'application', 'adapters'] } },
      },
    },
  },
  {
    from: { element: { type: 'adapters' } },
    allow: { to: { element: { types: { anyOf: ['core', 'adapters'] } } } },
  },
  {
    from: { element: { type: 'presentation' } },
    allow: {
      to: {
        element: { types: { anyOf: ['core', 'application', 'presentation'] } },
      },
    },
  },
  {
    from: { element: { type: 'composition' } },
    allow: {
      to: {
        element: {
          types: {
            anyOf: [
              'core',
              'application',
              'adapters',
              'composition',
              'presentation',
            ],
          },
        },
      },
    },
  },
];

/**
 * Creates the shared workspace ESLint profile.
 *
 * This profile owns framework-independent Nx, ESLint Boundaries, SonarJS,
 * dependency-boundary and library-size rules. Language-specific parsers and
 * presets are deliberately composed by the TypeScript and JavaScript profiles.
 *
 * @returns The flat ESLint configuration shared by workspace projects.
 */
export function createWorkspaceEslintConfig() {
  return [
    ...nx.configs['flat/base'],
    {
      files: ['**/*.ts'],
      plugins: { boundaries },
      settings: {
        'boundaries/elements': architecturalElements,
        'boundaries/files': [
          { category: 'entry-point', pattern: 'libs/*/src/index.ts' },
        ],
      },
      rules: {
        // Every local import must belong to a declared architectural element.
        // This closes the gap where an unclassified folder could bypass the
        // layer policies below.
        'boundaries/no-unknown-dependencies': ['error', { require: 'any' }],
        'boundaries/dependencies': [
          'error',
          { default: 'allow', policies: architecturalPolicies },
        ],
      },
    },
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
      files: ['**/*.ts'],
      ignores: ['**/*.spec.ts', '**/*.test.ts'],
      plugins: {
        'ai-guard': aiGuardPlugin,
        essential,
        sonarjs,
        tankos: localRules,
        unicorn,
      },
      rules: libraryQualityRules,
    },
    {
      files: intentionallyPromiseShapedAdapters,
      rules: {
        // These adapters implement Promise-returning ports while some
        // in-memory and pass-through operations are synchronous by nature.
        // Keeping the async boundary preserves rejected-Promise semantics.
        'ai-guard/no-async-without-await': 'off',
      },
    },
    {
      // Package entry points are public barrels: their exports intentionally
      // cross the internal layer folders and are checked by Nx project tags.
      files: ['libs/*/src/index.ts'],
      rules: { 'boundaries/no-unknown-dependencies': 'off' },
    },
    {
      files: ['**/cached-crud-repository-implementation.ts'],
      rules: { 'ai-guard/no-floating-promise': 'off' },
    },
    {
      files: ['**/*.ts'],
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
