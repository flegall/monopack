// @flow
import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { Semaphore } from 'await-semaphore';
import Bluebird from 'bluebird';
import * as lockfile from '@yarnpkg/lockfile';

type YarnLock = {|
  +path: string,
  +dependencies: {|
    +[string]: {|
      +version: string,
    |},
  |},
|};

type PackageJson = {|
  +path: string,
  +dependencies: { +[string]: string },
  +devDependencies: { +[string]: string },
  +peerDependencies: { +[string]: string },
  +lockFile: null | YarnLock,
|};

type FullyResolvedDependency = {|
  +type: 'RESOLVED',
  +packageName: string,
  +context: string,
  +declaredVersion: string,
  +resolvedVersion: string,
  +yarnLockPath: string,
|};
type NotFullyResolvedDependency = {|
  +type: 'RESOLVED',
  +packageName: string,
  +context: string,
  +declaredVersion: string,
  +resolvedVersion: null,
  +yarnLockPath: null,
|};
type ResolvedDependency = {|
  +type: 'RESOLVED',
  +packageName: string,
  +context: string,
  +declaredVersion: string,
  +resolvedVersion: string | null,
  +yarnLockPath: string | null,
|};
type NotResolvedDependency = {|
  +type: 'NOT_RESOLVED',
  +packageName: string,
  +context: string,
|};
type MaybeResolvedDependency = ResolvedDependency | NotResolvedDependency;

export type CollectedDependencies =
  | {|
      +type: 'SUCCESS_FULLY_DETERMINISTIC',
      +yarnLockFileToCopy: string | null,
      +dependencies: {
        packageName: string,
        version: string,
      }[],
    |}
  | {|
      +type: 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION',
      +conflicts: {
        +[packageName: string]: { packageVersion: string, context: string }[],
      },
    |}
  | {|
      +type: 'FAILURE_UNDECLARED_DEPENDENCIES',
      +undeclaredDependencies: {|
        +dependency: string,
        +context: string,
      |}[],
    |}
  | {|
      +type: 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS',
      +yarnLockFileToCopy: string,
      +dependencies: {
        packageName: string,
        version: string,
      }[],
    |}
  | {|
      +type: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS',
      +dependencies: {
        packageName: string,
        version: string,
      }[],
    |};

export default class DependencyCollector {
  monorepoRoot: string;
  promises: Promise<MaybeResolvedDependency>[] = [];
  yarnLockFiles: string[] = [];
  packageJsonsByContext: { [string]: Promise<?PackageJson> } = {};

  constructor(monorepoRoot: string) {
    this.monorepoRoot = monorepoRoot;
  }

  collectDependency(packageName: string, context: string): void {
    this.promises.push(
      semaphore.use(async () => {
        const packages = await this._getPackageJsons(context);

        for (let i = 0; i < packages.length; i++) {
          const pkg = packages[i];
          const packageJsonVersion = pkg.dependencies[packageName];

          if (packageJsonVersion) {
            const packageAndVersion = `${packageName}@${packageJsonVersion}`;

            let yarnLockMatchingPackage: ?YarnLock;
            for (let j = i; j < packages.length; j++) {
              const yarnLock = packages[j].lockFile;
              if (yarnLock && yarnLock.dependencies[packageAndVersion]) {
                yarnLockMatchingPackage = yarnLock;
                break;
              }
            }

            await this._collectPeerDependencies(pkg.path, packageName);

            return {
              type: 'RESOLVED',
              packageName,
              context,
              declaredVersion: packageJsonVersion,
              resolvedVersion: yarnLockMatchingPackage
                ? yarnLockMatchingPackage.dependencies[packageAndVersion]
                    .version
                : null,
              yarnLockPath: yarnLockMatchingPackage
                ? yarnLockMatchingPackage.path
                : null,
            };
          }
        }

        return { type: 'NOT_RESOLVED', packageName, context };
      })
    );
  }

  async _collectPeerDependencies(
    context: string,
    packageName: string,
    initialContext: string = context
  ): Promise<void> {
    const installedPackageDir = path.join(context, 'node_modules', packageName);
    const installedPackagePackageJson = await this._getPackageJsonCached(
      installedPackageDir
    );
    if (installedPackagePackageJson) {
      for (const peerDependency of Object.keys(
        installedPackagePackageJson.peerDependencies
      )) {
        this.collectDependency(peerDependency, initialContext);
      }
    } else {
      if (context !== this.monorepoRoot) {
        await this._collectPeerDependencies(
          path.join(context, '..'),
          packageName,
          initialContext
        );
      }
    }
  }

  async _getPackageJsons(context: string): Promise<PackageJson[]> {
    const packageJson = await this._getPackageJsonCached(context);
    const packageJsonsToAdd = packageJson ? [packageJson] : [];

    if (context !== this.monorepoRoot) {
      return [
        ...packageJsonsToAdd,
        ...(await this._getPackageJsons(path.join(context, '..'))),
      ];
    } else {
      return [...packageJsonsToAdd];
    }
  }

  _getPackageJsonCached(context: string): Promise<?PackageJson> {
    if (!this.packageJsonsByContext[context]) {
      this.packageJsonsByContext[context] = this._getPackageJson(context);
    }
    return this.packageJsonsByContext[context];
  }

  async _getPackageJson(context: string): Promise<?PackageJson> {
    const packageJsonFile = path.join(context, 'package.json');
    if (await exists(packageJsonFile)) {
      const pkgJson = JSON.parse(await readFile(packageJsonFile, 'utf8'));
      const yarnLockFile = path.join(context, 'yarn.lock');

      let lockFile = null;

      if (await exists(yarnLockFile)) {
        const lockFileContent = await readFile(yarnLockFile, 'utf8');

        // Needs to adjust line encoding on windows :(
        // https://github.com/yarnpkg/yarn/issues/5214#issuecomment-368274679
        const fixedLockFileContent = lockFileContent.replace(/\r/g, '');

        const yarnLock = lockfile.parse(fixedLockFileContent);
        lockFile = {
          path: context,
          dependencies: yarnLock.object,
        };
      }

      return {
        path: context,
        dependencies: pkgJson.dependencies || {},
        devDependencies: pkgJson.devDependencies || {},
        peerDependencies: pkgJson.peerDependencies || {},
        lockFile,
      };
    } else {
      return undefined;
    }
  }

  async resolveDependencies(): Promise<CollectedDependencies> {
    // Wait for all promises to be resolved (as some promises may be added
    // when Promise.all() is resolved)
    let maybeResolvedDependencies = [];
    while (maybeResolvedDependencies.length !== this.promises.length) {
      maybeResolvedDependencies = await Promise.all(this.promises);
    }

    const unresolvedDeps: NotResolvedDependency[] = (maybeResolvedDependencies.filter(
      ({ type }) => type === 'NOT_RESOLVED'
    ): any);
    if (unresolvedDeps.length > 0) {
      return {
        type: 'FAILURE_UNDECLARED_DEPENDENCIES',
        undeclaredDependencies: unresolvedDeps.map(
          ({ packageName, context }) => ({
            dependency: packageName,
            context,
          })
        ),
      };
    }

    const resolvedDeps: ResolvedDependency[] = (maybeResolvedDependencies.filter(
      ({ type }) => type === 'RESOLVED'
    ): any);

    const isFullyResolved = ({
      resolvedVersion,
      yarnLockPath,
    }: ResolvedDependency) => resolvedVersion !== null && yarnLockPath !== null;

    const notFullyResolvedDeps: NotFullyResolvedDependency[] = (resolvedDeps.filter(
      not(isFullyResolved)
    ): any);
    if (notFullyResolvedDeps.length > 0) {
      const dependenciesByPackageName: {
        [string]: NotFullyResolvedDependency[],
      } = _.groupBy(notFullyResolvedDeps, ({ packageName }) => packageName);

      const conflicts: Conflicts = Object.keys(
        dependenciesByPackageName
      ).reduce((accumulator: Conflicts, packageName) => {
        const conflicts: Conflicts = {};

        const dependencies = dependenciesByPackageName[packageName];
        const dependenciesByDeclaredVersion: {
          [string]: NotFullyResolvedDependency[],
        } = _.groupBy(dependencies, ({ declaredVersion }) => declaredVersion);

        if (Object.keys(dependenciesByDeclaredVersion).length > 1) {
          const conflict = [];

          for (const key in dependenciesByDeclaredVersion) {
            const [firstDependency] = dependenciesByDeclaredVersion[key];
            conflict.push({
              context: firstDependency.context,
              packageVersion: firstDependency.declaredVersion,
            });
          }

          conflicts[packageName] = conflict;
        }

        return { ...accumulator, ...conflicts };
      }, {});

      if (Object.keys(conflicts).length > 0) {
        return {
          type: 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION',
          conflicts,
        };
      }

      return {
        type: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS',
        dependencies: Object.keys(dependenciesByPackageName)
          .map(key => dependenciesByPackageName[key])
          .map(([firstDependency]) => firstDependency)
          .map(({ packageName, declaredVersion }) => ({
            packageName,
            version: declaredVersion,
          })),
      };
    }
    const fullyResolvedDeps: FullyResolvedDependency[] = (resolvedDeps.filter(
      isFullyResolved
    ): any);

    const resolvedDepsByPackageName: {
      [string]: FullyResolvedDependency[],
    } = _.groupBy(fullyResolvedDeps, ({ packageName }) => packageName);

    const conflicts: Conflicts = Object.keys(resolvedDepsByPackageName).reduce(
      (accumulator: Conflicts, packageName) => {
        const conflicts: Conflicts = {};

        const dependencies = resolvedDepsByPackageName[packageName];
        const dependenciesByResolvedVersion: {
          [string]: FullyResolvedDependency[],
        } = _.groupBy(dependencies, ({ resolvedVersion }) => resolvedVersion);

        if (Object.keys(dependenciesByResolvedVersion).length > 1) {
          const conflict = [];

          for (const key in dependenciesByResolvedVersion) {
            const [firstDependency] = dependenciesByResolvedVersion[key];
            conflict.push({
              context: firstDependency.context,
              packageVersion: firstDependency.declaredVersion,
            });
          }

          conflicts[packageName] = conflict;
        }

        return { ...accumulator, ...conflicts };
      },
      {}
    );

    if (Object.keys(conflicts).length > 0) {
      return {
        type: 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION',
        conflicts,
      };
    }

    const dependencies = Object.keys(resolvedDepsByPackageName)
      .map(key => resolvedDepsByPackageName[key])
      .map(([firstDependency]) => firstDependency)
      .map(({ packageName, declaredVersion }) => ({
        packageName,
        version: declaredVersion,
      }));

    const yarnLockPaths: string[] = _.uniq(
      fullyResolvedDeps.map(({ yarnLockPath }) => yarnLockPath)
    );

    if (yarnLockPaths.length > 1) {
      const yarnLockFileToCopy = path.join(yarnLockPaths[0], 'yarn.lock');
      return {
        type: 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS',
        yarnLockFileToCopy,
        dependencies,
      };
    }

    let yarnLockFileToCopy = path.join(this.monorepoRoot, 'yarn.lock');
    yarnLockFileToCopy = (await exists(yarnLockFileToCopy))
      ? yarnLockFileToCopy
      : null;

    return {
      type: 'SUCCESS_FULLY_DETERMINISTIC',
      yarnLockFileToCopy,
      dependencies,
    };
  }
}

type Conflicts = {
  [packageName: string]: { packageVersion: string, context: string }[],
};

type ThunkToThunk<T> = (() => Promise<T>) => Promise<T>;
const semaphore: {
  use: ThunkToThunk<MaybeResolvedDependency>,
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

function not<T>(predicate: (t: T) => boolean): T => boolean {
  return t => !predicate(t);
}
