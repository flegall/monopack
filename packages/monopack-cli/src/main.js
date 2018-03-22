// @flow
import fs from 'fs';
import DependencyCollector from 'monopack-dependency-collector';
import path from 'path';

import _ from 'lodash';

import { executeChildProcess, YARN_COMMAND } from 'monopack-process';

import Bluebird from 'bluebird';
import fsCopyFile from 'fs-copy-file';
import chalk from 'chalk';
import { build, type MonopackBuilderParams } from 'monopack-builder';
import { getMonopackConfig } from 'monopack-config';
import tmp from 'tmp-promise';

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

export async function main({
  command,
  mainJs,
  watch,
  outputDirectory,
  print,
  currentWorkingDirectory,
}: MonopackArgs): Promise<{ outputDirectory: string }> {
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
  let dependencies = {};
  let yarnLockFileToCopy: string | null = null;

  switch (collectedDependencies.type) {
    case 'SUCCESS_FULLY_DETERMINISTIC': {
      dependencies = collectedDependencies.dependencies.reduce(
        (dependencies, dependency) => ({
          ...dependencies,
          [dependency.packageName]: dependency.version,
        }),
        dependencies
      );
      yarnLockFileToCopy = collectedDependencies.yarnLockFileToCopy;
      print(
        chalk.white(
          '=>> monopack has resolved all dependencies, build will be deterministic'
        ) + '\n'
      );
      break;
    }
    case 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION': {
      throw new Error('TODO');
    }
    case 'FAILURE_UNDECLARED_DEPENDENCIES': {
      print(chalk.red('=>> Undeclared dependencies') + '\n');
      const dependenciesToString =
        collectedDependencies.undeclaredDependencies
          .map(({ dependency, context }) => `    ${dependency} from ${context}`)
          .join('\n') + '\n';
      print(chalk.white(dependenciesToString));
      process.exit(1);
    }
    case 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS': {
      throw new Error('TODO');
    }
    default: {
      // eslint-disable-next-line no-unused-vars
      const typeCheck: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS' =
        dependencies.type;
      throw new Error('TODO');
    }
  }

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

  return { outputDirectory: builderParams.outputDirectory };
}
