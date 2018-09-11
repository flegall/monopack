// @flow
import { getArgs } from '../cli';

import { checkOutput } from './cli-validation-helper';

jest.setTimeout(60000);

describe('cli validation', () => {
  it('when invoking without arguments, it should return an error and display help', () => {
    const argv = ['node', 'monopack.js'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual([
      helpMessageNew,
      undefined,
      'You need to enter a command',
    ]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with an unknown command, it should return an error and display help', () => {
    const argv = ['node', 'monopack.js', 'unknownCommand'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual([
      helpMessageNew,
      undefined,
      'Unknown argument: unknownCommand',
    ]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with --help, it should return no error and display help', () => {
    const argv = ['node', 'monopack.js', '--help'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toEqual([helpMessageNew]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with --help and a command, it should return no error and display help for that command', () => {
    const argv = ['node', 'monopack.js', '--help', 'build'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toEqual([buildCommandHelpNew]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with a command and no main file, it should return an error and display help for that command', () => {
    const argv = ['node', 'monopack.js', 'build'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual([
      buildCommandHelpNew,
      undefined,
      'Not enough non-option arguments: got 0, need at least 1',
    ]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with --version it should return no error and display the package version', () => {
    const argv = ['node', 'monopack.js', '--version'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(0);
    expect(logs).toEqual([require('../../package.json').version]);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with a command, a main file and -d without target it should return an error and display help for the command', () => {
    const argv = ['node', 'monopack.js', 'build', 'main.js', '-d'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual([
      buildCommandHelpNew,
      undefined,
      'Not enough arguments following: d',
    ]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with a command, a main file and -m without extra modules it should return an error and display help for the command', () => {
    const argv = ['node', 'monopack.js', 'build', 'main.js', '-m'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual([
      buildCommandHelpNew,
      undefined,
      'Not enough arguments following: m',
    ]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with a command, a main file and -i and -n it it should return an error and display message', () => {
    const argv = ['node', 'monopack.js', 'build', 'main.js', '-i', '-n'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual([
      'Error: --install-packages && --no-packages-installation are mutually exclusive',
    ]);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  if (!process.version.startsWith('v6.')) {
    it('when invoking with the debug command, a main file and --debug-host-port without arguments it should return an error and display help for the command', () => {
      const argv = [
        'node',
        'monopack.js',
        'debug',
        'main.js',
        '-m',
        '--debug-host-port',
      ];
      const { exit, errors, logs, warnings } = checkOutput(
        args => getArgs(args),
        argv
      );

      expect(exit).toBe(1);
      expect(errors).toEqual([
        debugCommandHelpNew,
        undefined,
        'Not enough arguments following: debug-host-port',
      ]);
      expect(logs).toEqual([]);
      expect(warnings).toEqual([]);
    });
  } else {
    it('when invoking with the debug command, on node v6, a error should be reported', () => {
      const argv = ['node', 'monopack.js', 'debug', 'main.js'];
      const { exit, errors, logs, warnings } = checkOutput(
        args => getArgs(args),
        argv
      );

      expect(exit).toBe(1);
      expect(errors).toEqual([
        'Error: Debug command is not available on node v6.',
      ]);
      expect(logs).toEqual([]);
      expect(warnings).toEqual([]);
    });
  }

  it('when invoking with the run command, a main file and --debug-host-port it should return an error and display a message', () => {
    const argv = [
      'node',
      'monopack.js',
      'run',
      'main.js',
      '--debug-host-port',
      '1337',
    ];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual(['Error: --debug-host-port requires debug command']);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('when invoking with the run command, a main file and --debug-break it should return an error and display a message', () => {
    const argv = ['node', 'monopack.js', 'run', 'main.js', '--debug-break'];
    const { exit, errors, logs, warnings } = checkOutput(
      args => getArgs(args),
      argv
    );

    expect(exit).toBe(1);
    expect(errors).toEqual(['Error: --debug-break requires debug command']);
    expect(logs).toEqual([]);
    expect(warnings).toEqual([]);
  });
});

const optionsHelpNew = `Options:
  --help                          Show help                            [boolean]
  --version                       Show version number                  [boolean]
  --watch, -w                     Enable watch mode   [boolean] [default: false]
  --out-dir, -d                   Output directory (default into a temp dir)
                                                                        [string]
  --no-packages-installation, -n  Do not install packages after build  [boolean]
  --install-packages, -i          Install packages after build         [boolean]
  --with-extra-module, -m         Adds an extra module to the dependencies.
                                  It can be useful for dynamically required
                                  dependencies that monopack cannot detect
                                  (e.g.: an sql driver).

                                  It expects the package name without the
                                  version. (e.g: 'mysql' not 'mysql@2.16.0).
                                  It can be use multiple times "monopack build
                                  main.js -m mysql -m postgresql" in order to
                                  provide multiple dependencies.

                                  Make sure to install it in the same package as
                                  the main file, otherwise another version might
                                  be picked up.                         [string]
  --debug-host-port               [host:]port setting to pass to node --inspect
                                  option.
                                  It must be used with the debug command.
                                                                        [string]
  --debug-break                   Break at start of main script.
                                  This option is required when you want to debug
                                  something that gets immediately executed when
                                  starting.
                                  It triggers the --inspect-brk node option.
                                  It must be used with the debug command.
                                                                       [boolean]`;

const debugCommandHelpNew = `monopack.js debug main

Runs an application in debug mode (Node >= v8 only)

Positionals:
  main  The application entry point source file              [string] [required]

${optionsHelpNew}`;

const buildCommandHelpNew = `monopack.js build main

Builds an application

Positionals:
  main  The application entry point source file              [string] [required]

${optionsHelpNew}`;

const helpMessageNew = `monopack.js <command>

Commands:
  monopack.js build main  Builds an application
  monopack.js run main    Runs an application
  monopack.js debug main  Runs an application in debug mode (Node >= v8 only)

${optionsHelpNew}`;
