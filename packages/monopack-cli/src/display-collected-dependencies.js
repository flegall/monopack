// @flow
import chalk from 'chalk';

import type { CollectedDependencies } from 'monopack-dependency-collector';

type Result =
  | {
      exitCode: 0,
      output: string,
      dependencies: { [string]: string },
      yarnLockFileToCopy: string | null,
    }
  | {
      exitCode: 1 | 2,
      output: string,
    };
export default function displayCollectedDependencies(
  collectedDependencies: CollectedDependencies
): Result {
  switch (collectedDependencies.type) {
    case 'SUCCESS_FULLY_DETERMINISTIC': {
      const dependencies = collectDependencies(
        collectedDependencies.dependencies
      );
      const yarnLockFileToCopy = collectedDependencies.yarnLockFileToCopy;
      const output =
        chalk.white(
          '=>> monopack has resolved all dependencies, build will be deterministic'
        ) + '\n';
      const exitCode = 0;
      return {
        output,
        exitCode,
        dependencies,
        yarnLockFileToCopy,
      };
    }
    case 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION': {
      let conflictToString = '';

      const { conflicts } = collectedDependencies;
      let counter = 1;
      for (const packageName in conflicts) {
        conflictToString += chalk.white(`    Conflict #${counter}`) + '\n';
        counter++;

        const conflictsOfPackage = conflicts[packageName];
        for (const { context, packageVersion } of conflictsOfPackage) {
          conflictToString += chalk.white(
            `'      ${packageName}@${packageVersion} from ${context}` + '\n'
          );
        }
      }

      const output =
        chalk.red('=>> Conflicting dependencies') +
        '\n' +
        chalk.white(conflictToString);
      return {
        exitCode: 2,
        output,
      };
    }
    case 'FAILURE_UNDECLARED_DEPENDENCIES': {
      const dependenciesToString =
        collectedDependencies.undeclaredDependencies
          .map(({ dependency, context }) => `    ${dependency} from ${context}`)
          .join('\n') + '\n';

      const output =
        chalk.red('=>> Undeclared dependencies') +
        '\n' +
        chalk.white(dependenciesToString);
      const exitCode = 1;

      return {
        output,
        exitCode,
      };
    }
    case 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS': {
      const dependencies = collectDependencies(
        collectedDependencies.dependencies
      );
      const yarnLockFileToCopy = collectedDependencies.yarnLockFileToCopy;
      const output =
        chalk.white(
          '=>> monopack has resolved all dependencies, however build will not be deterministic as multiple yarn.lock files have been found'
        ) + '\n';
      return {
        output,
        exitCode: 0,
        dependencies,
        yarnLockFileToCopy,
      };
    }
    default: {
      // eslint-disable-next-line no-unused-vars
      const typeCheck: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS' =
        collectedDependencies.type;

      const dependencies = collectDependencies(
        collectedDependencies.dependencies
      );
      const output =
        chalk.white(
          '=>> monopack has resolved all dependencies, however build will not be deterministic as no yarn.lock files have been found'
        ) + '\n';
      return {
        output,
        exitCode: 0,
        dependencies,
        yarnLockFileToCopy: null,
      };
    }
  }
}

function collectDependencies(
  dependencies: {
    packageName: string,
    version: string,
  }[]
): { [string]: string } {
  return dependencies.reduce(
    (dependencies, dependency) => ({
      ...dependencies,
      [dependency.packageName]: dependency.version,
    }),
    {}
  );
}
