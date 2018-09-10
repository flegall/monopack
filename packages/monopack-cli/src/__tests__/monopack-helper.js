// @flow
import { executeChildProcess } from 'monopack-process';
import type { ExitOrSignal } from 'monopack-process';

import { main } from '../main';

export async function buildAndRun(
  root: string,
  mainJs: string
): Promise<{
  compilationOutput: string,
  buildDirectory: string,
  result: ExitOrSignal,
  stdout: string,
  stderr: string,
}> {
  const { compilationOutput, buildDirectory } = await monopack(root, mainJs, {
    command: 'build',
  });
  const { result, stdout, stderr } = await executeChildProcess(
    'node',
    ['./build/main.js'],
    { cwd: root }
  );
  return { compilationOutput, buildDirectory, result, stdout, stderr };
}

export async function monopack(
  root: string,
  mainJs: string,
  {
    command,
    runArgs = [],
    nodeArgs = [],
    outputDirectory,
    extraModules = [],
    installPackages,
    debugOptions = {},
  }: {|
    +command: 'build' | 'run' | 'debug',
    +runArgs?: string[],
    +nodeArgs?: string[],
    +outputDirectory?: null | string,
    +extraModules?: $ReadOnlyArray<string>,
    +installPackages?: null | boolean,
    +debugOptions?: {| +debugHostPort?: string, +debugBreak?: true |},
  |}
): Promise<{
  compilationOutput: string,
  buildDirectory: string,
  success: boolean,
  exitCode: number,
}> {
  let compilationOutput = '';
  const result = await main({
    watch: false,
    print: content => {
      compilationOutput = compilationOutput + content;
    },
    printError: content => {
      compilationOutput = compilationOutput + content;
    },
    outputDirectory:
      outputDirectory !== undefined ? outputDirectory : './build',
    mainJs,
    currentWorkingDirectory: root,
    command,
    installPackages: installPackages !== undefined ? installPackages : null,
    extraModules,
    nodeArgs,
    runArgs,
    debugOptions: debugOptions || {},
  });
  const buildDirectory = result.outputDirectory;
  return {
    compilationOutput,
    buildDirectory,
    success: result.success,
    exitCode: result.exitCode,
  };
}
