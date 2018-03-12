// @flow
import path from 'path';

import { expect } from 'chai';
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import DependencyCollector from '../index';

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
        expect(result).to.deep.equal({
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
        expect(result).to.deep.equal({
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
});
