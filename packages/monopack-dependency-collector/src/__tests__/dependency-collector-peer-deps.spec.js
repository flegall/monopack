// @flow
import path from 'path';

import chai, { expect } from 'chai';
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import DependencyCollector from '../index';

// $FlowIgnore
jest.setTimeout(60000);

chai.config.truncateThreshold = 0;

describe('dependency-collector peer dependencies', () => {
  it('should collect top-level installed peer dependencies', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withDependencies({
        glob: '7.1.2',
        'glob-promise': '3.4.0',
      })
      .withWorkspacesEnabled()
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency('glob-promise', root);

        // then
        const result = await collector.resolveDependencies();
        expect(result).to.deep.equal({
          type: 'SUCCESS_FULLY_DETERMINISTIC',
          yarnLockFileToCopy: path.join(root, 'yarn.lock'),
          dependencies: [
            {
              packageName: 'glob-promise',
              version: '3.4.0',
            },
            {
              packageName: 'glob',
              version: '7.1.2',
            },
          ],
        });
      });
  });

  it('should detect non-installed top-level peer dependencies', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withDependencies({
        'glob-promise': '3.4.0',
      })
      .withWorkspacesEnabled()
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency('glob-promise', root);

        // then
        const result = await collector.resolveDependencies();
        expect(result).to.deep.equal({
          type: 'FAILURE_UNDECLARED_DEPENDENCIES',
          undeclaredDependencies: [
            {
              dependency: 'glob',
              context: root,
            },
          ],
        });
      });
  });

  it('should collect top-level installed sub-package peer dependencies', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withWorkspacesEnabled()
      .withPackages(
        aPackage()
          .named('sub')
          .withDependencies({
            glob: '7.1.2',
            'glob-promise': '3.4.0',
          })
      )
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency(
          'glob-promise',
          path.join(root, 'packages', 'sub')
        );

        // then
        const result = await collector.resolveDependencies();
        expect(result).to.deep.equal({
          type: 'SUCCESS_FULLY_DETERMINISTIC',
          yarnLockFileToCopy: path.join(root, 'yarn.lock'),
          dependencies: [
            {
              packageName: 'glob-promise',
              version: '3.4.0',
            },
            {
              packageName: 'glob',
              version: '7.1.2',
            },
          ],
        });
      });
  });

  it('should detect non-installed sub-package peer dependencies', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withPackages(
        aPackage()
          .named('sub')
          .withDependencies({
            'glob-promise': '3.4.0',
          })
      )
      .withWorkspacesEnabled()
      .execute(async ({ root }) => {
        const collector = new DependencyCollector(root);

        // when
        collector.collectDependency(
          'glob-promise',
          path.join(root, 'packages', 'sub')
        );

        // then
        const result = await collector.resolveDependencies();
        expect(result).to.deep.equal({
          type: 'FAILURE_UNDECLARED_DEPENDENCIES',
          undeclaredDependencies: [
            {
              dependency: 'glob',
              context: path.join(root, 'packages', 'sub'),
            },
          ],
        });
      });
  });
});
