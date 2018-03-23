// @flow
import { expect } from 'chai';

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
    expect(result.exitCode).to.equal(0);
    if (result.exitCode === 0) {
      expect(result.dependencies).to.deep.equal({ lodash: '4.17.5' });
      expect(result.yarnLockFileToCopy).to.equal('yarn.lock');
      expect(result.output).to.have.string(
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
    expect(result.exitCode).to.equal(0);
    if (result.exitCode === 0) {
      expect(result.dependencies).to.deep.equal({ lodash: '4.17.5' });
      expect(result.yarnLockFileToCopy).to.equal(null);
      expect(result.output).to.have.string(
        '=>> monopack has resolved all dependencies, build will be deterministic'
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
    expect(result.exitCode).to.equal(1);
    if (result.exitCode === 1) {
      expect(result.output).to.have.string('=>> Undeclared dependencies');
      expect(result.output).to.have.string('    lodash from /home/context');
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
    expect(result.exitCode).to.equal(2);
    if (result.exitCode === 2) {
      expect(result.output).to.have.string('=>> Conflicting dependencies');
      expect(result.output).to.have.string('    Conflict #1');
      expect(result.output).to.have.string(
        '      lodash@4.0.17 from /home/project/context1'
      );
      expect(result.output).to.have.string(
        '      lodash@4.0.18 from /home/project/context2'
      );
    }
  });
});
