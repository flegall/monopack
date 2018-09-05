// @flow
import { executeChildProcess } from 'monopack-process';
import type { ExitOrSignal } from 'monopack-process';

import { main } from '../main';

export async function buildAndRun(
  root: string,
  mainJs: string
): Promise<{
  compilationOutput: string,
  result: ExitOrSignal,
  stdout: string,
  stderr: string,
}> {
  const { compilationOutput } = await build(root, mainJs);
  const { result, stdout, stderr } = await executeChildProcess(
    'node',
    ['./build/main.js'],
    { cwd: root }
  );
  return { compilationOutput, result, stdout, stderr };
}

export async function build(
  root: string,
  mainJs: string,
  outputDirectory: string | null = './build',
  extraModules: $ReadOnlyArray<string> = []
): Promise<{
  compilationOutput: string,
  buildDirectory: string,
}> {
  let compilationOutput = '';
  const result = await main({
    watch: false,
    print: content => {
      compilationOutput = compilationOutput + content;
    },
    outputDirectory,
    mainJs,
    currentWorkingDirectory: root,
    command: 'build',
    installPackages: null,
    extraModules,
  });
  if (result.success) {
    const buildDirectory = result.outputDirectory;
    return { compilationOutput, buildDirectory };
  } else {
    throw new Error(
      `Compilation failed : '${compilationOutput}' exitCode: ${result.exitCode}`
    );
  }
}
