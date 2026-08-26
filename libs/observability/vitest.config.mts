import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'observability',
  root: __dirname,
  angular: false,
  staticCopy: false,
  setupFiles: false,
});
