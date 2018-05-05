// @flow
import displayCollectedDependencies from '../display-collected-dependencies';

describe('displayCollectedDependencies', () => {
  it('should display dependencies for SUCCESS_FULLY_DETERMINISTIC with yarn.lock', () => {
    // given
    const collectedDependencies = {
      type: 'SUCCESS_FULLY_DETERMINISTIC',
      yarnLockFileToCopy: 'yarn.lock',
      dependencies: [
        {
          packageName: 'lodash',
          version: '4.17.5',
        },
      ],
    };

    // when
    const result = displayCollectedDependencies(collectedDependencies);

    // then
    expect(result.exitCode).toBe(0);
    if (result.exitCode === 0) {
      expect(result.dependencies).toEqual({ lodash: '4.17.5' });
      expect(result.yarnLockFileToCopy).toBe('yarn.lock');
      expect(result.output).toContain(
        '=>> monopack has resolved all dependencies, build will be deterministic'
      );
    }
  });

  it('should display dependencies for SUCCESS_FULLY_DETERMINISTIC without yarn.lock', () => {
    // given
    const collectedDependencies = {
      type: 'SUCCESS_FULLY_DETERMINISTIC',
      yarnLockFileToCopy: null,
      dependencies: [
        {
          packageName: 'lodash',
          version: '4.17.5',
        },
      ],
    };

    // when
    const result = displayCollectedDependencies(collectedDependencies);

    // then
    expect(result.exitCode).toBe(0);
    if (result.exitCode === 0) {
      expect(result.dependencies).toEqual({ lodash: '4.17.5' });
      expect(result.yarnLockFileToCopy).toBe(null);
      expect(result.output).toContain(
        '=>> monopack has resolved all dependencies, build will be deterministic'
      );
    }
  });

  it('should display dependencies for SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS', () => {
    // given
    const collectedDependencies = {
      type: 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS',
      yarnLockFileToCopy: 'yarn.lock',
      dependencies: [
        {
          packageName: 'lodash',
          version: '4.17.5',
        },
      ],
    };

    // when
    const result = displayCollectedDependencies(collectedDependencies);

    // then
    expect(result.exitCode).toBe(0);
    if (result.exitCode === 0) {
      expect(result.dependencies).toEqual({ lodash: '4.17.5' });
      expect(result.yarnLockFileToCopy).toBe('yarn.lock');
      expect(result.output).toContain(
        '=>> monopack has resolved all dependencies, however build will not be deterministic as multiple yarn.lock files have been found'
      );
    }
  });

  it('should display dependencies for SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS', () => {
    // given
    const collectedDependencies = {
      type: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS',
      dependencies: [
        {
          packageName: 'lodash',
          version: '4.17.5',
        },
      ],
    };

    // when
    const result = displayCollectedDependencies(collectedDependencies);

    // then
    expect(result.exitCode).toBe(0);
    if (result.exitCode === 0) {
      expect(result.dependencies).toEqual({ lodash: '4.17.5' });
      expect(result.yarnLockFileToCopy).toBe(null);
      expect(result.output).toContain(
        '=>> monopack has resolved all dependencies, however build will not be deterministic as no yarn.lock files have been found'
      );
    }
  });

  it('should display error for FAILURE_UNDECLARED_DEPENDENCIES', () => {
    // given
    const collectedDependencies = {
      type: 'FAILURE_UNDECLARED_DEPENDENCIES',
      undeclaredDependencies: [
        {
          dependency: 'lodash',
          context: '/home/context',
        },
      ],
    };

    // when
    const result = displayCollectedDependencies(collectedDependencies);

    // then
    expect(result.exitCode).toBe(1);
    if (result.exitCode === 1) {
      expect(result.output).toContain('=>> Undeclared dependencies');
      expect(result.output).toContain('    lodash from /home/context');
    }
  });

  it('should display error for FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION', () => {
    // given
    const collectedDependencies = {
      type: 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION',
      conflicts: {
        lodash: [
          { packageVersion: '4.0.17', context: '/home/project/context1' },
          { packageVersion: '4.0.18', context: '/home/project/context2' },
        ],
      },
    };

    // when
    const result = displayCollectedDependencies(collectedDependencies);

    // then
    expect(result.exitCode).toBe(2);
    if (result.exitCode === 2) {
      expect(result.output).toContain('=>> Conflicting dependencies');
      expect(result.output).toContain('    Conflict #1');
      expect(result.output).toContain(
        '      lodash@4.0.17 from /home/project/context1'
      );
      expect(result.output).toContain(
        '      lodash@4.0.18 from /home/project/context2'
      );
    }
  });
});
