import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'authz-ui',
  root: __dirname,
  staticCopy: false,
  aliases: {
    '@tankos/authn': '../authn/src/index.ts',
    '@tankos/data-access': '../data-access/src/index.ts',
  },
});
