// @flow
import { splitArgs } from '../cli';

describe('cli - splitArgs()', () => {
  it('should include only monopack args when there is no ::', () => {
    expect(
      splitArgs([
        'node',
        'monopack.js',
        'build',
        'main.js',
        '--arg1',
        'value1',
        '--arg2',
      ])
    ).toEqual({
      monopackArgs: ['build', 'main.js', '--arg1', 'value1', '--arg2'],
      nodeArgs: [],
      runArgs: [],
    });
  });

  it('should split monopack args and node when there is a ::', () => {
    expect(
      splitArgs(['node', 'monopack.js', 'run', 'main.js', '::', '--help'])
    ).toEqual({
      monopackArgs: ['run', 'main.js'],
      nodeArgs: ['--help'],
      runArgs: [],
    });
  });

  it('should split monopack args node and run args when there are two ::', () => {
    expect(
      splitArgs([
        'node',
        'monopack.js',
        'run',
        'main.js',
        '::',
        '--help',
        '::',
        '--node',
      ])
    ).toEqual({
      monopackArgs: ['run', 'main.js'],
      nodeArgs: ['--help'],
      runArgs: ['--node'],
    });
  });
});
