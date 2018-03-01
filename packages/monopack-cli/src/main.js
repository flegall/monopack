// @flow
import path from 'path';

import chalk from 'chalk';
import { build, type MonopackBuilderParams } from 'monopack-builder';
import { getMonopackConfig } from 'monopack-config';
import tmp from 'tmp-promise';

export type MonopackArgs = {
  command: 'build' | 'run' | 'debug',
  mainJs: string,
  outputDirectory: string | null,
  watch: boolean,
  println: string => void,
  currentWorkingDirectory: string,
};

export async function main({
  command,
  mainJs,
  watch,
  outputDirectory,
  println,
  currentWorkingDirectory,
}: MonopackArgs): Promise<void> {
  const version = require('../package.json').version;
  const mainJsFullPath = path.join(currentWorkingDirectory, mainJs);

  println(chalk.white('=>> monopack v' + version) + '\n');
  println(
    chalk.white('=>> monopack') +
      ' ' +
      chalk.red(command) +
      ' ' +
      chalk.cyan(mainJsFullPath) +
      ' ' +
      (watch ? chalk.blue('--watch') : '') +
      ' ' +
      (outputDirectory ? chalk.blue(`--out-dir ${outputDirectory}`) : '') +
      ' ' +
      '\n'
  );
  const monopackConfig = getMonopackConfig(mainJsFullPath);

  const builderParams: MonopackBuilderParams = {
    ...monopackConfig,
    mainJs: mainJsFullPath,
    outputDirectory: outputDirectory
      ? path.join(currentWorkingDirectory, outputDirectory)
      : (await tmp.dir()).path,
    println,
  };

  println(
    chalk.white('=>> monopack is using monorepo root') +
      ' ' +
      chalk.green(monopackConfig.monorepoRootPath) +
      ' ' +
      '\n'
  );

  println(
    chalk.white('=>> monopack will build a main.js into') +
      ' ' +
      chalk.green(builderParams.outputDirectory) +
      ' ' +
      '\n'
  );

  await build(builderParams);

  println(chalk.green('=>> monopack successfully packaged your app !') + '\n');
}
