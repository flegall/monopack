// @flow
import childProcess from 'child_process';
import type { ChildProcess } from 'child_process';

const { execFile } = childProcess;

type ExecuteChildProcessOptions = {
  cwd?: string,
  env?: Object,
  encoding?: string,
  timeout?: number,
  maxBuffer?: number,
  killSignal?: string,
  uid?: number,
  gid?: number,
  outPrint?: string => void,
  errPrint?: string => void,
};
export type ExitOrSignal =
  | { type: 'EXIT', exitCode: number }
  | { type: 'SIGNAL', signal: string };
export type ExecuteChildResult = {
  result: ExitOrSignal,
  stdout: string,
  stderr: string,
};

export async function executeChildProcessOrFail(
  file: string,
  args: string[] = [],
  options: $Shape<ExecuteChildProcessOptions> = {}
): Promise<ExecuteChildResult> {
  const { result, stdout, stderr } = await executeChildProcess(
    file,
    args,
    options
  );
  if (result.exitCode === 0) {
    return { result, stdout, stderr };
  } else {
    console.error({ result, file, args, options });
    console.error('-------stdout\n', stdout.trim());
    console.error('-------stderr\n', stderr);
    throw new Error('Could not execute command');
  }
}
export async function executeChildProcess(
  file: string,
  args: string[] = [],
  options: $Shape<ExecuteChildProcessOptions> = {}
): Promise<ExecuteChildResult> {
  const { outPrint = (_: string) => {} } = options;
  const { errPrint = (_: string) => {} } = options;
  const child = execFile(file, args, options);
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', data => {
    stdout += data;
    outPrint(data);
  });
  child.stderr.on('data', data => {
    stderr += data;
    errPrint(data);
  });
  const result = await promiseFromChildProcess(child);
  return { result, stdout, stderr };
}

function promiseFromChildProcess(child: ChildProcess): Promise<ExitOrSignal> {
  // (process_child does not expose a promise api)
  // eslint-disable-next-line promise/avoid-new
  return new Promise(function(resolve, reject) {
    child.addListener('error', error => reject(error));
    child.addListener('exit', (exitCode, signal) =>
      resolve(
        exitCode !== null
          ? { type: 'EXIT', exitCode }
          : { type: 'SIGNAL', signal }
      )
    );
  });
}
