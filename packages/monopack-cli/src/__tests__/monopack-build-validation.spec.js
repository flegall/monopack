// @flow
import { aMonorepo } from 'monopack-repo-builder';

import { build } from './monopack-build-helper';

jest.setTimeout(60000);

describe('monopack build - validation', () => {
  it('should reject building a non-existing file', async () => {
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .execute(async ({ root }) => {
        // when
        let error = null;
        try {
          await build(root, 'main.js');
        } catch (e) {
          error = e;
        }

        // then
        expect(error).not.toBeNull();
        if (error) {
          expect(error.message).toContain('Compilation failed');
          expect(error.message).toContain('entry file was not found');
        }
      });
  });
});
