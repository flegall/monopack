// @flow

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

  constructor(monorepoRoot: string) {
    this.monorepoRoot = monorepoRoot;
  }

  collectDependency(packageName: string, context: string): void {}

  resolveDependencies(): Promise<CollectedDependencies> {
    throw new Error('Not implemented');
  }
}
