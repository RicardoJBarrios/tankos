/* eslint-disable @typescript-eslint/no-unsafe-call */
import { execFileSync } from 'node:child_process';

import { workspaceRoot } from '@nx/devkit';

export default function globalTeardown(): void {
  execFileSync('/bin/bash', [`${workspaceRoot}/tools/stop-dev.sh`], {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });
}
