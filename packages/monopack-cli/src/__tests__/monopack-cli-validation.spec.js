// @flow
import { executeChildProcess } from 'monopack-process';

jest.setTimeout(60000);

describe('monopack cli validation', () => {
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
      ['../../bin/monopack.js', 'build', '-d'],
      { cwd: __dirname }
    );

    expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
    expect(stderr).toBe(
      `${buildCommandHelp}
Not enough non-option arguments: got 0, need at least 1
`
    );
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
                                                      [boolean] [default: false]
`;

const buildCommandHelp = `monopack.js build main

Builds an application

Positionals:
  main  The application entry point source file              [string] [required]

${optionsHelp}`;

const helpMessage = `monopack.js <command>

Commands:
  monopack.js build main  Builds an application
  monopack.js run main    Runs an application
  monopack.js debug main  Runs an application in debug mode

${optionsHelp}`;
