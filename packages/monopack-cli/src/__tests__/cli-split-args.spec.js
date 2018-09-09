// @flow
import { splitArgs } from '../cli';

describe('cli - splitArgs()', () => {
  it('should include no args when there are no args:', () => {
    expect(splitArgs(['node', 'monopack.js'])).toEqual({
      monopackArgs: [],
      nodeArgs: [],
      runArgs: [],
    });
  });

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
      runArgs: [],
      nodeArgs: [],
    });
  });

  it('should split monopack args and run args when there is a ::', () => {
    expect(
      splitArgs(['node', 'monopack.js', 'run', 'main.js', '::', '--help'])
    ).toEqual({
      monopackArgs: ['run', 'main.js'],
      runArgs: ['--help'],
      nodeArgs: [],
    });
  });

  it('should split monopack args run and ode args when there are two ::', () => {
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
      runArgs: ['--help'],
      nodeArgs: ['--node'],
    });
  });
});
