// @flow
export { executeChildProcess, executeChildProcessOrFail } from './process';
export type { ExitOrSignal, ExecuteChildResult } from './process';

export const YARN_COMMAND = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
