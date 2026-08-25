import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'data-access-ui',
  root: __dirname,
  dedupe: [
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
  ],
  inlineAngularDependencies: true,
});
