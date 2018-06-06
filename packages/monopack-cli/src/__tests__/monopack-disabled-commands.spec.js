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
      watch: true,
      mainJs: 'main.js',
      currentWorkingDirectory: '.',
      outputDirectory: '.',
      installPackages: null,
    });

    expect(result).toEqual({
      success: false,
      exitCode: -1,
    });
    expect(buffer).toContain('--watch toggle is not implemented yet !');
  });

  it('run should return -1 with error message', async () => {
    let buffer = '';
    const result = await main({
      command: 'run',
      print: text => {
        buffer += text;
      },
      watch: false,
      mainJs: 'main.js',
      currentWorkingDirectory: '.',
      outputDirectory: '.',
      installPackages: null,
    });

    expect(result).toEqual({
      success: false,
      exitCode: -1,
    });
    expect(buffer).toContain('run command is not implemented yet !');
  });

  it('debug should return -1 with error message', async () => {
    let buffer = '';
    const result = await main({
      command: 'debug',
      print: text => {
        buffer += text;
      },
      watch: false,
      mainJs: 'main.js',
      currentWorkingDirectory: '.',
      outputDirectory: '.',
      installPackages: null,
    });

    expect(result).toEqual({
      success: false,
      exitCode: -1,
    });
    expect(buffer).toContain('debug command is not implemented yet !');
  });
});
