import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'tankos',
  root: __dirname,
  staticCopy: false,
  aliases: {
    '@tankos/authn': '../../libs/authn/src/index.ts',
    '@tankos/authn-firebase-ui': '../../libs/authn-firebase-ui/src/index.ts',
    '@tankos/authz-ui': '../../libs/authz-ui/src/index.ts',
    '@tankos/data-access': '../../libs/data-access/src/index.ts',
    '@tankos/formatting': '../../libs/formatting/src/index.ts',
    '@tankos/time': '../../libs/time/src/index.ts',
    '@tankos/units-ui': '../../libs/units-ui/src/index.ts',
  },
});
