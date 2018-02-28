// @flow
import chalk from 'chalk';
import { getMonopackConfig } from 'monopack-config';

import type { MonopackArgs } from './cli';

export async function main({
  command,
  mainJs,
  watch,
  outputDirectory,
}: MonopackArgs): Promise<void> {
  const version = require('../package.json').version;
  process.stdout.write(chalk.white('=>> monopack v' + version) + '\n');
  process.stdout.write(
    chalk.white('=>> monopack') +
      ' ' +
      chalk.red(command) +
      ' ' +
      chalk.cyan(mainJs) +
      ' ' +
      (watch ? chalk.blue('--watch') : '') +
      ' ' +
      (outputDirectory ? chalk.blue(`--out-dir ${outputDirectory}`) : '') +
      ' ' +
      '\n'
  );

  const monopackConfig = getMonopackConfig(mainJs);

  process.stdout.write(
    chalk.white('=>> monopack is using monorepo root:') +
      ' ' +
      chalk.green(monopackConfig.monorepoRootPath) +
      ' ' +
      '\n'
  );
}
