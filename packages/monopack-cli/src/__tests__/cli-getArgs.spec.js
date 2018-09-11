// @flow
import { getArgs } from '../cli';

import { checkOutput } from './cli-validation-helper';

jest.setTimeout(60000);

describe('cli validation', () => {
  it('when invoking with build command, it should produce full args', () => {
    const argv = ['node', 'monopack.js', 'build', 'main.js'];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('build');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command, it should produce full args', () => {
    const argv = ['node', 'monopack.js', 'run', 'main.js'];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command and run arguments, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '::',
      'hello',
      'world',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual(['hello', 'world']);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command and node arguments, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '::',
      '::',
      '--inspect',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual(['--inspect']);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with debug command, it should produce full args', () => {
    const argv = ['node', 'monopack.js', 'debug', 'main.js'];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('debug');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command and --watch option, it should produce full args', () => {
    const argv = ['node', 'monopack.js', 'run', 'main.js', '--watch'];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(true);
  });

  it('when invoking with run command and --out-dir option, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '--out-dir',
      './output',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual('./output');
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command and --no-packages-installation option, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '--no-packages-installation',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(false);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command and --install-packages option, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '--install-packages',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(true);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with run command and --with-extra-module option, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '--with-extra-module',
      'postgresql',
      '--with-extra-module',
      'mysql',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('run');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({});
    expect(result.extraModules).toEqual(['postgresql', 'mysql']);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with debug command and --debug-host-port option, it should produce full args', () => {
    const argv = [
      'node',
      'monopack.js',
      'debug',
      'main.js',
      '--debug-host-port',
      'localhost:1337',
    ];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('debug');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({ debugHostPort: 'localhost:1337' });
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });

  it('when invoking with debug command and --debug-break option, it should produce full args', () => {
    const argv = ['node', 'monopack.js', 'debug', 'main.js', '--debug-break'];
    const { exit, errors, logs, warnings, result } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(null);
    expect(errors).toEqual([]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);

    expect(result.command).toBe('debug');
    expect(result.currentWorkingDirectory).toBe(process.cwd());
    expect(result.debugOptions).toEqual({ debugBreak: true });
    expect(result.extraModules).toEqual([]);
    expect(result.installPackages).toEqual(null);
    expect(result.mainJs).toEqual('main.js');
    expect(result.nodeArgs).toEqual([]);
    expect(result.outputDirectory).toEqual(null);
    expect(result.runArgs).toEqual([]);
    expect(result.watch).toEqual(false);
  });
});
