import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'units-ui',
  root: __dirname,
  aliases: {
    '@tankos/authn': '../authn/src/index.ts',
    '@tankos/units': '../units/src/index.ts',
    '@tankos/data-access': '../data-access/src/index.ts',
    '@tankos/data-access-ui': '../data-access-ui/src/index.ts',
  },
  dedupe: [
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
  ],
  inlineAngularDependencies: true,
});
