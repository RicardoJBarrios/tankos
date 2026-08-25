# Workspace ESLint profiles

These files are the reusable ESLint boundaries for the workspace. Project
configurations should import the profile factories instead of duplicating
presets or rule blocks.

```js
import { createAngularEslintConfig } from '../../tools/eslint/angular-profiles.mjs';

export default [...baseConfig, ...createAngularEslintConfig({ prefix: 'tankos' })];
```

The root `eslint.config.mjs` composes the workspace, TypeScript and JavaScript
profiles. Project configurations consume this composition as `baseConfig`.

## Effective profile composition

Every project receives the workspace profile through the root configuration:

- Nx `flat/base`.
- ESLint Boundaries architectural policies for library layers.
- Workspace module-boundary constraints.
- SonarJS recommended rules for library TypeScript, plus complexity limits of
  10 cyclomatic and 15 cognitive complexity.
- `class-methods-use-this` and the workspace function-declaration guardrails.
- Library limits of 300 lines per file and 60 lines per function.

TypeScript files additionally receive:

- Nx `flat/typescript`.
- `typescript-eslint` `strictTypeChecked`.
- TypeScript ESLint `projectService`, rooted at the workspace, for every
  TypeScript file. Typed linting is mandatory; it is not an opt-in flag.

The strict preset objects are explicitly scoped to TypeScript-family files so
type-aware rules cannot accidentally execute against JavaScript configuration
files. Formatting remains owned by Prettier, so the separate stylistic
typescript-eslint preset is composed after removing only rules already owned by
e18e or the regular-expression profile. Formatting-only decisions remain owned
by Prettier.

JavaScript-family files additionally receive Nx `flat/javascript` and
`@eslint/js` `configs.all`. This is limited to tooling and configuration;
product and test code remains TypeScript. Node globals are declared explicitly
for those configuration and tooling files.

Specialized strict profiles are also composed globally:

- `@e18e/eslint-plugin` enables compatible modernization, dependency and
  performance rules. Rules requiring APIs newer than the workspace target are
  intentionally excluded.
- `eslint-plugin-regexp` uses its complete preset and promotes warnings to
  errors for every source-language file.
- `eslint-plugin-tsdoc` validates every TypeScript documentation comment with
  `tsdoc/syntax`.
- `eslint-plugin-security` uses its complete preset, promoted to errors, for
  Node-oriented tooling, server code and Firebase Admin code.

Angular projects additionally receive the complete Nx `flat/angular` and
`flat/angular-template` presets through `createAngularEslintConfig`. The
current Nx Angular TypeScript rules are `contextual-lifecycle`,
`no-empty-lifecycle-method`, `no-input-rename`, `no-inputs-metadata-property`,
`no-output-native`, `no-output-on-prefix`, `no-output-rename`,
`no-outputs-metadata-property`, `prefer-inject`, `prefer-standalone`,
`use-lifecycle-interface` and `use-pipe-transform-interface`. The Nx template
rules are `banana-in-box`, `eqeqeq` and `no-negated-async`.

The language profiles are available independently when a project needs to
compose them explicitly:

```js
import { createTypeScriptEslintConfig } from '../../tools/eslint/typescript-profiles.mjs';

export default createTypeScriptEslintConfig();
```

```js
import { createJavaScriptEslintConfig } from '../../tools/eslint/javascript-profiles.mjs';

export default createJavaScriptEslintConfig();
```

Test frameworks are separate profiles:

- `createVitestEslintConfig()` applies the workspace Vitest profile to unit
  and integration test files, excluding `e2e` directories. It rejects focused
  and skipped test declarations and imports from `node:test`. Vitest itself
  also runs with `allowOnly: false`, so focused tests fail at runtime even
  when ESLint is not run.
- `createPlaywrightEslintConfig()` applies `eslint-plugin-playwright` only to
  `apps/**/e2e/**`.

This keeps framework-specific globals, assertions and safety rules isolated.
An application that owns both kinds of tests composes both profiles; a
library normally composes only the Vitest profile.

The profile accepts:

- `prefix`: the selector prefix required by the project (`tankos`).
- `profile`: `recommended` by default, or `strict` for additional focused
  component rules such as OnPush and inline-declaration limits.

The Angular profile additionally enables Angular rules for dependency
injection, standalone declarations, lifecycle contracts, output contracts,
duplicate metadata entries, and uncalled signals. The `strict` profile adds
OnPush and inline-declaration limits.

The shared profiles intentionally exclude rules that conflict with current
workspace architecture:

- `template/no-call-expression` is not enabled because Angular signals are
  callable values in templates.
- `no-pipe-impure` is not enabled because the time display pipes intentionally
  react to locale changes.

Keep the profile framework-focused. Application-specific exceptions belong in
the consuming project's ESLint configuration and must be documented there.
