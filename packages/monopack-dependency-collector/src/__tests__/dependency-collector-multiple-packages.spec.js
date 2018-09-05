// @flow
import path from 'path';

import { aMonorepo, aPackage } from 'monopack-repo-builder';

import DependencyCollector from '../index';

jest.setTimeout(60000);

describe('dependency-collector - multiple packages', () => {
  it(`when dependencies are all resolved from multiple yarn.lock files,
    and only a single version of each dependency was found,
    then the dependencies are resolved, but their installation will not be deterministic`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withLernaJsonFile()
      .withPackages(
        aPackage()
          .named('sub1')
          .withDependencies({ lodash: '^4.17.4' }),
        aPackage()
          .named('sub2')
          .withDependencies({ lodash: '^4.17.5' })
      )
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency(
          'lodash',
          path.join(root, 'packages', 'sub1')
        );
        collector.collectDependency(
          'lodash',
          path.join(root, 'packages', 'sub2')
        );

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'SUCCESS_NOT_DETERMINISTIC_MULTIPLE_YARN_LOCKS',
          yarnLockFileToCopy: path.join(root, 'packages', 'sub1', 'yarn.lock'),
          dependencies: [
            {
              packageName: 'lodash',
              version: '^4.17.4',
            },
          ],
        });
      });
  });

  it(`when dependencies are all resolved from multiple yarn.lock files,
    and multiple versions of at least one dependency was found,
    then error is returned`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withLernaJsonFile()
      .withPackages(
        aPackage()
          .named('sub1')
          .withDependencies({ lodash: '4.17.4' }),
        aPackage()
          .named('sub2')
          .withDependencies({ lodash: '4.17.5' })
      )
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency(
          'lodash',
          path.join(root, 'packages', 'sub1')
        );
        collector.collectDependency(
          'lodash',
          path.join(root, 'packages', 'sub2')
        );

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'FAILURE_NEEDS_DEPENDENCY_CONFLICT_RESOLUTION',
          conflicts: {
            lodash: [
              {
                packageVersion: '4.17.4',
                context: path.join(root, 'packages', 'sub1'),
              },
              {
                packageVersion: '4.17.5',
                context: path.join(root, 'packages', 'sub2'),
              },
            ],
          },
        });
      });
  });
});
