import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'tankos',
  root: __dirname,
  staticCopy: false,
  aliases: {
    '@tankos/auth': '../../libs/auth/src/index.ts',
    '@tankos/data-access': '../../libs/data-access/src/index.ts',
    '@tankos/formatting': '../../libs/formatting/src/index.ts',
    '@tankos/time': '../../libs/time/src/index.ts',
  },
});
