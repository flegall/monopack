// @flow
import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import Bluebird from 'bluebird';
import fsCopyFile from 'fs-copy-file';
import chalk from 'chalk';
import tmp from 'tmp-promise';
import { build, type MonopackBuilderParams } from 'monopack-builder';
import DependencyCollector from 'monopack-dependency-collector';
import { executeChildProcess, YARN_COMMAND } from 'monopack-process';
import { getMonopackConfig } from 'monopack-config';

import displayCollectedDependencies from './display-collected-dependencies';

const writeFile: (
  string | Buffer | number,
  string | Buffer | Uint8Array,
  Object | string | void
) => Promise<void> = Bluebird.promisify(fs.writeFile);

const copyFile: (string, string) => Promise<void> = Bluebird.promisify(
  fsCopyFile
);

export type MonopackArgs = {
  command: 'build' | 'run' | 'debug',
  mainJs: string,
  outputDirectory: string | null,
  watch: boolean,
  print: string => void,
  currentWorkingDirectory: string,
};
export type MonopackResult =
  | {
      success: true,
      outputDirectory: string,
    }
  | {
      success: false,
      exitCode: number,
    };

export async function main({
  command,
  mainJs,
  watch,
  outputDirectory,
  print,
  currentWorkingDirectory,
}: MonopackArgs): Promise<MonopackResult> {
  const version = require('../package.json').version;
  const mainJsFullPath = path.join(currentWorkingDirectory, mainJs);

  print(chalk.white('=>> monopack v' + version) + '\n');
  print(
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
  if (command === 'run') {
    print(
      '=>> ' + chalk.inverse('run command is not implemented yet !') + '\n'
    );
    return { success: false, exitCode: -1 };
  }

  if (command === 'debug') {
    print(
      '=>> ' + chalk.inverse('debug command is not implemented yet !') + '\n'
    );
    return { success: false, exitCode: -1 };
  }

  if (watch) {
    print(
      '=>> ' + chalk.inverse('--watch toggle is not implemented yet !') + '\n'
    );
    return { success: false, exitCode: -1 };
  }

  const monopackConfig = getMonopackConfig(mainJsFullPath);

  const dependencyCollector = new DependencyCollector(
    monopackConfig.monorepoRootPath
  );

  const builderParams: MonopackBuilderParams = {
    ...monopackConfig,
    mainJs: mainJsFullPath,
    outputDirectory: outputDirectory
      ? path.join(currentWorkingDirectory, outputDirectory)
      : (await tmp.dir()).path,
    print,
    collectDependency: (packageName, context) => {
      dependencyCollector.collectDependency(packageName, context);
    },
  };

  print(
    chalk.white('=>> monopack is using monorepo root') +
      ' ' +
      chalk.green(monopackConfig.monorepoRootPath) +
      ' ' +
      '\n'
  );

  print(
    chalk.white('=>> monopack will build a main.js into') +
      ' ' +
      chalk.green(builderParams.outputDirectory) +
      ' ' +
      '\n'
  );

  await build(builderParams);

  print(chalk.white('=>> monopack will resolve dependencies') + '\n');

  const collectedDependencies = await dependencyCollector.resolveDependencies();
  const result = displayCollectedDependencies(collectedDependencies);
  print(result.output);

  if (result.exitCode !== 0) {
    return {
      exitCode: result.exitCode,
      success: false,
    };
  }

  const dependencies = result.dependencies;
  const yarnLockFileToCopy = result.yarnLockFileToCopy;
  print(chalk.white('=>> monopack will build a package.json') + '\n');
  const packageJsonContent = {
    name: 'app',
    version: '1.0.0',
    main: 'main.js',
    private: true,
    dependencies: {
      'source-map-support': require('../package.json').dependencies[
        'source-map-support'
      ],
      ...dependencies,
    },
    devDependencies: {},
  };
  await writeFile(
    path.join(builderParams.outputDirectory, 'package.json'),
    JSON.stringify(packageJsonContent, null, 2)
  );

  if (yarnLockFileToCopy) {
    print(
      chalk.white(
        `=>> monopack will copy yarn.lock from ${yarnLockFileToCopy}`
      ) + '\n'
    );
    await copyFile(
      yarnLockFileToCopy,
      path.join(builderParams.outputDirectory, 'yarn.lock')
    );
  }

  print(
    chalk.white(
      `=>> monopack will install dependencies into ${
        builderParams.outputDirectory
      }`
    ) + '\n'
  );
  const execution = await executeChildProcess(YARN_COMMAND, [], {
    cwd: builderParams.outputDirectory,
    outPrint: data => print(chalk.magentaBright(data)),
    errPrint: data => print(chalk.red(data)),
  });
  if (!_.isEqual(execution.result, { type: 'EXIT', exitCode: 0 })) {
    print(chalk.red('=>> Yarn could not be executed') + '\n');
    print(JSON.stringify(execution, null, 2) + '\n');
    throw new Error(
      'Yarn could not be executed' + JSON.stringify(execution, null, 2)
    );
  }

  print(
    chalk.green(
      `=>> monopack successfully packaged your app in ${
        builderParams.outputDirectory
      }`
    ) + '\n'
  );

  return { success: true, outputDirectory: builderParams.outputDirectory };
}
