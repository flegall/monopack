// @flow
import { aMonorepo, aPackage } from 'monopack-repo-builder';

describe('getMonopackConfig', () => {
  it(`when a local .monopack.config.js is present,
    it should use it even if there are top-level config files`, async () => {
    await aMonorepo()
      .withDefaultConfigFile()
      .withPackages(aPackage().withDefaultConfigFile())
      .then(async monorepo => {});
  });
  it(`when no local config is present if a top-level .monopack.config.js is present,
     it should use it`, () => {});
  it(`when no file exists if there is a lerna.json file upwards,
    it should use default configuration and define monorepo root where lerna.json is found`, () => {});
  it(`when no file exists and there is no lerna.json
      if there is package.json with yarn workspaces upwards,
    it should use default configuration and define monorepo root on the workspaces root`, () => {});
  it(`when no file exists
      and there is no lerna.json nor yarn workspaces,
    it should use default configuration and define monorepo root at the top-most package json level, `, () => {});
});
