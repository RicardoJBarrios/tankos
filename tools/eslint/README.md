# Workspace ESLint profiles

These files are the reusable ESLint boundaries for the workspace. Project
configurations should import the profile factories instead of duplicating
presets or rule blocks.

```js
import { createAngularEslintConfig } from '../../tools/eslint/angular-profiles.mjs';

export default [
  ...baseConfig,
  ...createAngularEslintConfig({ prefix: 'tankos' }),
];
```

The root `eslint.config.mjs` composes the workspace, TypeScript and JavaScript
profiles. Project configurations consume this composition as `baseConfig`.

## Effective profile composition

Every project receives the workspace profile through the root configuration:

- Nx `flat/base`.
- Sheriff `configs.all`.
- Workspace module-boundary constraints.
- SonarJS recommended rules for library TypeScript, plus complexity limits of
  10 cyclomatic and 15 cognitive complexity.
- `class-methods-use-this` and the workspace function-declaration guardrails.
- Library limits of 300 lines per file and 60 lines per function.

TypeScript files additionally receive:

- Nx `flat/typescript`.
- TypeScript ESLint `projectService`, rooted at the workspace, for every
  TypeScript file. Typed linting is mandatory; it is not an opt-in flag.

JavaScript-family files additionally receive Nx `flat/javascript`. This is
limited to tooling and configuration; product and test code remains
TypeScript.

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

- `createVitestEslintConfig()` applies `eslint-plugin-vitest` to unit and
  integration test files, excluding `e2e` directories.
- `createPlaywrightEslintConfig()` applies `eslint-plugin-playwright` only to
  `apps/**/e2e/**`.

This keeps framework-specific globals, assertions and safety rules isolated.
An application that owns both kinds of tests composes both profiles; a
library normally composes only the Vitest profile.

The profile accepts:

- `prefix`: the selector prefix required by the project (`tankos` or `veril`).
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
