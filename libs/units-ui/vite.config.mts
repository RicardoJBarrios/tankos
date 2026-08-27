import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'units-ui',
  root: __dirname,
  aliases: {
    '@tankos/authn': '../authn/src/index.ts',
    '@tankos/authz-ui': '../authz-ui/src/index.ts',
    '@tankos/units': '../units/src/index.ts',
    '@tankos/data-access': '../data-access/src/index.ts',
    '@tankos/data-access-ui': '../data-access-ui/src/index.ts',
    '@tankos/data-access-material-ui':
      '../data-access-material-ui/src/index.ts',
    '@tankos/formatting': '../formatting/src/index.ts',
    '@tankos/observability-ui': '../observability-ui/src/index.ts',
    '@tankos/units-composition': '../units-composition/src/index.ts',
  },
  dedupe: [
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
  ],
  inlineAngularDependencies: true,
});
