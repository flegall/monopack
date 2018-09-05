// @flow
import fs from 'fs';
import path from 'path';

import Bluebird from 'bluebird';
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import DependencyCollector from '../index';

jest.setTimeout(60000);

describe('dependency-collector', () => {
  it('should collect a top-level dependency installed with yarn from the monorepo root', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withDependencies({ lodash: '4.17.5' })
      .withWorkspacesEnabled()
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency('lodash', root);

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'SUCCESS_FULLY_DETERMINISTIC',
          yarnLockFileToCopy: path.join(root, 'yarn.lock'),
          dependencies: [
            {
              packageName: 'lodash',
              version: '4.17.5',
            },
          ],
        });
      });
  });

  it('should collect a top-level dependency installed with yarn from a sub-package', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withDependencies({ lodash: '4.17.5' })
      .withWorkspacesEnabled()
      .withPackages(aPackage().named('sub'))
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency(
          'lodash',
          path.join(root, 'packages', 'sub')
        );

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'SUCCESS_FULLY_DETERMINISTIC',
          yarnLockFileToCopy: path.join(root, 'yarn.lock'),
          dependencies: [
            {
              packageName: 'lodash',
              version: '4.17.5',
            },
          ],
        });
      });
  });

  it('should collect a sub-package dependency installed with yarn from a sub-package', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
      .withPackages(
        aPackage()
          .named('sub')
          .withDependencies({ lodash: '4.17.5' })
      )
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency(
          'lodash',
          path.join(root, 'packages', 'sub')
        );

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'SUCCESS_FULLY_DETERMINISTIC',
          yarnLockFileToCopy: path.join(root, 'yarn.lock'),
          dependencies: [
            {
              packageName: 'lodash',
              version: '4.17.5',
            },
          ],
        });
      });
  });

  it(`when a dependency is required but not installed
    then an error is returned`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency('lodash', path.join(root));

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'FAILURE_UNDECLARED_DEPENDENCIES',
          undeclaredDependencies: [{ dependency: 'lodash', context: root }],
        });
      });
  });

  it(`when two dependencies are installed and required from each sub-package with yarn workspaces,
    if the dependencies are compatible
    then a single version is used`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
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
          type: 'SUCCESS_FULLY_DETERMINISTIC',
          yarnLockFileToCopy: path.join(root, 'yarn.lock'),
          dependencies: [
            {
              packageName: 'lodash',
              version: '^4.17.4',
            },
          ],
        });
      });
  });

  it(`when two dependencies are installed and required from each sub-package with yarn workspaces,
      if the dependencies are not compatible
      then an error is returned indicating that conflicts must be resolved`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
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

  it(`when dependencies are resolved without yarn.lock files,
    then, the dependencies are resolved,
    but their installation will not be deterministic`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
      .withDependencies({ lodash: '4.17.5' })
      .execute(async ({ root }) => {
        await unlink(path.join(root, 'yarn.lock'));
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency('lodash', path.join(root));

        // then
        const result = await collector.resolveDependencies();
        expect(result).toEqual({
          type: 'SUCCESS_NOT_DETERMINISTIC_NO_YARN_LOCKS',
          dependencies: [
            {
              packageName: 'lodash',
              version: '4.17.5',
            },
          ],
        });
      });
  });

  it(`when two different versions of dependencies are installed and required from each sub-package with no yarn.lock,
      an error is returned indicating that conflicts must be resolved`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
      .withPackages(
        aPackage()
          .named('sub1')
          .withDependencies({ lodash: '^4.17.4' }),
        aPackage()
          .named('sub2')
          .withDependencies({ lodash: '^4.17.5' })
      )
      .execute(async ({ root }) => {
        await unlink(path.join(root, 'yarn.lock'));
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
                packageVersion: '^4.17.4',
                context: path.join(root, 'packages', 'sub1'),
              },
              {
                packageVersion: '^4.17.5',
                context: path.join(root, 'packages', 'sub2'),
              },
            ],
          },
        });
      });
  });
});

const unlink: string => Promise<void> = Bluebird.promisify(fs.unlink);
