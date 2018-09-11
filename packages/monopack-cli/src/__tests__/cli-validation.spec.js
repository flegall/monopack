// @flow
import { executeChildProcess } from 'monopack-process';

jest.setTimeout(60000);

describe('cli validation', () => {
  it('when invoking without arguments, it should return an error and display help', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toBe(`${helpMessage}
You need to enter a command
`);
    expect(stdout).toBe('');
  });

  it('when invoking with an unknown command, it should return an error and display help', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'unkownCommand'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toBe(`${helpMessage}
Unknown argument: unkownCommand
`);
    expect(stdout).toBe('');
  });

  it('when invoking with --help, it should return no error and display help', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', '--help'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
    expect(stderr).toBe('');
    expect(stdout).toBe(helpMessage);
  });

  it('when invoking with --help and a command, it should return no error and display help for that command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', '--help', 'build'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
    expect(stderr).toBe('');
    expect(stdout).toBe(buildCommandHelp);
  });

  it('when invoking with a command and no main file, it should return an error and display help for that command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'build'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stdout).toBe('');
    expect(stderr).toBe(
      `${buildCommandHelp}
Not enough non-option arguments: got 0, need at least 1
`
    );
  });

  it('when invoking with --version it should return no error and display the package version', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', '--version'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
    expect(stdout).toBe(require('../../package.json').version + '\n');
    expect(stderr).toBe('');
  });

  it('when invoking with a command, a main file and -d without target it should return an error and display help for the command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'build', 'main.js', '-d'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toBe(
      `${buildCommandHelp}
Not enough arguments following: d
`
    );
    expect(stdout).toBe('');
  });

  it('when invoking with a command, a main file and -m without extra modules it should return an error and display help for the command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'build', 'main.js', '-m'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toBe(
      `${buildCommandHelp}
Not enough arguments following: m
`
    );
    expect(stdout).toBe('');
  });

  it('when invoking with a command, a main file and -i and -n it it should return an error and display message', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'build', 'main.js', '-i', '-n'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toContain(
      'Error: --install-packages && --no-packages-installation are mutually exclusive'
    );
    expect(stdout).toBe('');
  });

  if (!process.version.startsWith('v6.')) {
    it('when invoking with the debug command, a main file and --debug-host-port without arguments it should return an error and display help for the command', async () => {
      const { result, stdout, stderr } = await executeChildProcess(
        'node',
        ['../../bin/monopack.js', 'debug', 'main.js', '--debug-host-port'],
        { cwd: __dirname }
      );

      expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
      expect(stderr).toBe(
        `${debugCommandHelp}
Not enough arguments following: debug-host-port
`
      );
      expect(stdout).toBe('');
    });
  } else {
    it('when invoking with the debug command, on node v6, a error should be reported', async () => {
      const { result, stdout, stderr } = await executeChildProcess(
        'node',
        ['../../bin/monopack.js', 'debug', 'main.js'],
        { cwd: __dirname }
      );

      expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
      expect(stderr).toContain(
        'Error: Debug command is not available on node v6.'
      );
      expect(stdout).toBe('');
    });
  }

  it('when invoking with the run command, a main file and --debug-host-port it should return an error and display a message', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'run', 'main.js', '--debug-host-port', '1337'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toContain('Error: --debug-host-port requires debug command');
    expect(stdout).toBe('');
  });

  it('when invoking with the run command, a main file and --debug-break it should return an error and display a message', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'run', 'main.js', '--debug-break'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toContain('Error: --debug-break requires debug command');
    expect(stdout).toBe('');
  });
});

const optionsHelp = `Options:
  --help                          Show help                            [boolean]
  --version                       Show version number                  [boolean]
  --watch, -w                     Enable watch mode   [boolean] [default: false]
  --out-dir, -d                   Output directory (default into a temp dir)
                                                                        [string]
  --no-packages-installation, -n  Do not install packages after build
                                                      [boolean] [default: false]
  --install-packages, -i          Install packages after build
                                                       [boolean] [default: true]
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
                                                                       [boolean]
`;

const debugCommandHelp = `monopack.js debug main

Runs an application in debug mode (Node >= v8 only)

Positionals:
  main  The application entry point source file              [string] [required]

${optionsHelp}`;

const buildCommandHelp = `monopack.js build main

Builds an application

Positionals:
  main  The application entry point source file              [string] [required]

${optionsHelp}`;

const helpMessage = `monopack.js <command>

Commands:
  monopack.js build main  Builds an application
  monopack.js run main    Runs an application
  monopack.js debug main  Runs an application in debug mode (Node >= v8 only)

${optionsHelp}`;
