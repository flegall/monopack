// @flow
import { aMonorepo } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

describe('getMonopackConfig() - config file validation', () => {
  it(`when an invalid value for 'monorepoRootPath' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {monorepoRootPath: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false, []);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            'Invalid value 1 supplied to /monorepoRootPath: String | Nil'
          );
        }
      });
  });

  it(`when an invalid value for 'webpackConfigModifier' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {webpackConfigModifier: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false, []);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            'Invalid value 1 supplied to /webpackConfigModifier: Function | Nil'
          );
        }
      });
  });

  it(`when an invalid value for 'installPackagesAfterBuild' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false, []);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            'Invalid value 1 supplied to /installPackagesAfterBuild: Boolean | Nil'
          );
        }
      });
  });

  it(`when an invalid value for 'babelConfigModifier' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {babelConfigModifier: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false, []);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            'Invalid value 1 supplied to /babelConfigModifier: Function | Nil'
          );
        }
      });
  });

  it(`when an invalid value for 'extraModules' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {extraModules: 'lodash'};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false, []);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            'Invalid value \\"lodash\\" supplied to /extraModules: Array<String> | Nil'
          );
        }
      });
  });

  it(`when an unknown key is given, the whole config should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {unknownKey: 42};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false, []);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            'Invalid value 42 supplied to /unknownKey: Nil'
          );
        }
      });
  });
});
