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
  const { compilationOutput, buildDirectory } = await build(root, mainJs);
  const { result, stdout, stderr } = await executeChildProcess(
    'node',
    ['./build/main.js'],
    { cwd: root }
  );
  return { compilationOutput, buildDirectory, result, stdout, stderr };
}

export async function build(
  root: string,
  mainJs: string,
  {
    outputDirectory,
    extraModules = [],
    installPackages,
  }: {
    +outputDirectory?: null | string,
    +extraModules?: $ReadOnlyArray<string>,
    +installPackages?: null | boolean,
  } = {}
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
    outputDirectory:
      outputDirectory !== undefined ? outputDirectory : './build',
    mainJs,
    currentWorkingDirectory: root,
    command: 'build',
    installPackages: installPackages !== undefined ? installPackages : null,
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
