// @flow
import fs from 'fs';
import path from 'path';

import { Semaphore } from 'await-semaphore';
import Bluebird from 'bluebird';
import * as lockfile from '@yarnpkg/lockfile';

type ThunkToThunk<T> = (() => Promise<T>) => Promise<T>;

export type CollectedDependencies =
  | {
      type: 'SUCCESS_FULLY_DETERMINISTIC',
      yarnLockFileToCopy: string,
      dependencies: {
        packageName: string,
        version: string,
      }[],
    }
  | {
      type: 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION',
      conflicts: {
        [packageName: string]: { packageVersion: string, context: string }[],
      }[],
    }
  | {
      type: 'FAILURE_UNDECLARED_DEPENDENCIES',
      undeclaredDependencies: (
        | {
            type: 'UNDECLARED',
            dependency: string,
          }
        | {
            type: 'DECLARED_AS_DEV_DEPENDENCY',
            dependency: string,
          }
      )[],
    }
  | {
      type: 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS',
      yarnLockFileToCopy: string,
      dependencies: {
        packageName: string,
        version: string,
      }[],
    }
  | {
      type: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS',
      dependencies: {
        packageName: string,
        version: string,
      }[],
    };

export default class DependencyCollector {
  monorepoRoot: string;
  promises: Promise<void>[] = [];
  resolvedDependencies: { packageName: string, declaredVersion: string }[] = [];
  yarnLockFiles: string[] = [];

  constructor(monorepoRoot: string) {
    this.monorepoRoot = monorepoRoot;
  }

  collectDependency(packageName: string, context: string): void {
    this.promises.push(
      semaphore.use(async () => {
        const packages = await this._getPackageJsons(context);
        for (const pkg of packages) {
          const packageJsonVersion = pkg.dependencies[packageName];
          if (packageJsonVersion) {
            this.resolvedDependencies.push({
              packageName,
              declaredVersion: packageJsonVersion,
            });
            break;
          }
        }
      })
    );
  }

  async _getPackageJsons(context: string): Promise<PackageJson[]> {
    const localPackageJsons: PackageJson[] = [];
    const packageJsonFile = path.join(context, 'package.json');
    if (await exists(packageJsonFile)) {
      const pkgJson = JSON.parse(await readFile(packageJsonFile, 'utf8'));
      const yarnLockFile = path.join(context, 'yarn.lock');

      let lockFile = null;

      if (await exists(yarnLockFile)) {
        const lockFileContent = await readFile(yarnLockFile, 'utf8');
        const yarnLock = lockfile.parse(lockFileContent);
        lockFile = { dependencies: yarnLock.object };
      }

      localPackageJsons.push({
        path: context,
        dependencies: pkgJson.dependencies,
        devDependencies: pkgJson.devDependencies,
        lockFile,
      });
    }

    if (context !== this.monorepoRoot) {
      return [
        ...localPackageJsons,
        ...(await this._getPackageJsons(path.join(context, '..'))),
      ];
    } else {
      return [...localPackageJsons];
    }
  }

  async resolveDependencies(): Promise<CollectedDependencies> {
    await Promise.all(this.promises);
    return {
      type: 'SUCCESS_FULLY_DETERMINISTIC',
      yarnLockFileToCopy: path.join(this.monorepoRoot, 'yarn.lock'),
      dependencies: this.resolvedDependencies.map(
        ({ packageName, declaredVersion }) => ({
          packageName,
          version: declaredVersion,
        })
      ),
    };
  }
}

type PackageJson = {
  path: string,
  dependencies: { [string]: string },
  devDependencies: { [string]: string },
  lockFile: null | { dependencies: { [string]: { version: string } } },
};

const semaphore: {
  use: ThunkToThunk<void>,
} = new Semaphore(10);

const readFile: (string, 'utf8') => Promise<string> = Bluebird.promisify(
  fs.readFile
);
const access: string => Promise<boolean> = Bluebird.promisify(fs.access);

const exists: string => Promise<boolean> = async file => {
  try {
    await access(file);
    return true;
  } catch (error) {
    return false;
  }
};
