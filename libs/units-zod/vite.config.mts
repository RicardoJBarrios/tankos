import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'units-zod',
  root: __dirname,
  angular: false,
  setupFiles: false,
});
