// @flow
import { expect } from 'chai';
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

describe('getMonopackConfig', () => {
  it(`when no local config is present if a top-level monopack.config.js is present,
     it should use it`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {monorepoRootPath: '.'};`)
      .withPackages(aPackage().named('child'))
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = await getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).to.equal(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).to.equal(ref);
        expect(config.webpackConfigModifier(ref)).to.equal(ref);
      });
  });

  it(`when a local monopack.config.js defining the monorepo root is present,
    it should use it even if there are top-level config files`, async () => {
    // given
    await aMonorepo()
      .withDefaultConfigFile()
      .withPackages(
        aPackage().withConfigFile(
          `module.exports = {monorepoRootPath: '../..'};`
        )
      )
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = await getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).to.equal(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).to.equal(ref);
        expect(config.webpackConfigModifier(ref)).to.equal(ref);
      });
  });

  xit(`when a local monopack.config.js not defining the monorepo root is present
    if there is a lerna.json file upwards,
    it should define the mono repo root where lerna.json is found`, async () => {});

  xit(`when a local monopack.config.js not defining the monorepo root is present,
    if there is no lerna.json file upwards,
    if there is package.json with yarn workspaces upwards,
    it should define the mono repo root on the workspaces root`, async () => {});

  xit(`when a local monopack.config.js not defining the monorepo root is present,
    if there are no lerna.json nor yarn workspaces,
    it should define the mono repo root on the workspaces root`, async () => {});

  xit(`when no file exists if there is a lerna.json file upwards,
    it should use default configuration and define monorepo root where lerna.json is found`, () => {});

  xit(`when no file exists and there is no lerna.json
      if there is package.json with yarn workspaces upwards,
    it should use default configuration and define monorepo root on the workspaces root`, () => {});

  xit(`when no file exists
      and there is no lerna.json nor yarn workspaces,
    it should use default configuration and define monorepo root at the top-most package json level, `, () => {});
});
