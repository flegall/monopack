// @flow
import { main } from '../main';

describe('monopack disabled commands', () => {
  it('build --watch should return -1 with error message', async () => {
    let buffer = '';
    const result = await main({
      command: 'build',
      print: text => {
        buffer += text;
      },
      printError: text => {
        buffer += text;
      },
      watch: true,
      mainJs: 'main.js',
      currentWorkingDirectory: '.',
      outputDirectory: '.',
      installPackages: null,
      extraModules: [],
      nodeArgs: [],
      runArgs: [],
      debugOptions: {},
    });

    expect(result).toEqual({
      success: false,
      outputDirectory: '.',
      exitCode: -1,
    });
    expect(buffer).toContain('--watch toggle is not implemented yet !');
  });
});
