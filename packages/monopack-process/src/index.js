// @flow

import type { ExecuteChildResult } from './process';
import { executeChildProcessOrFail } from './process';

const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
export function executeYarn(
  cwd: string,
  ...args: string[]
): Promise<ExecuteChildResult> {
  return executeChildProcessOrFail(yarnCommand, args, {
    cwd,
  });
}

export { executeChildProcess, executeChildProcessOrFail } from './process';
export type { ExitOrSignal } from './process';
