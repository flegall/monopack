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
    });

    expect(result).toEqual({
      success: false,
      outputDirectory: '.',
      exitCode: -1,
    });
    expect(buffer).toContain('--watch toggle is not implemented yet !');
  });

  it('debug should return -1 with error message', async () => {
    let buffer = '';
    const result = await main({
      command: 'debug',
      print: text => {
        buffer += text;
      },
      printError: text => {
        buffer += text;
      },
      watch: false,
      mainJs: 'main.js',
      currentWorkingDirectory: '.',
      outputDirectory: '.',
      installPackages: null,
      extraModules: [],
      nodeArgs: [],
      runArgs: [],
    });

    expect(result).toEqual({
      success: false,
      outputDirectory: '.',
      exitCode: -1,
    });
    expect(buffer).toContain('debug command is not implemented yet !');
  });
});
