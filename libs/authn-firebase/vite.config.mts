import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'authn-firebase',
  root: __dirname,
  angular: false,
  staticCopy: false,
  aliases: {
    '@tankos/authn': '../authn/src/index.ts',
    '@tankos/data-access': '../data-access/src/index.ts',
  },
});
