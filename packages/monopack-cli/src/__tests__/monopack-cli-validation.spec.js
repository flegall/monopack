// @flow
import { expect } from 'chai';
import { executeChildProcess } from 'monopack-process';

describe('monopack cli validation', () => {
  it('when invoking without arguments, it should return an error and display help', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 1 });
    expect(stderr).to.equal(`${helpMessage}You need to enter a command
`);
    expect(stdout).to.equal('');
  });

  it('when invoking with an unknown command, it should return an error and display help', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'unkownCommand'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 1 });
    expect(stderr).to.equal(`${helpMessage}Unknown argument: unkownCommand
`);
    expect(stdout).to.equal('');
  });

  it('when invoking with --help, it should return no error and display help', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', '--help'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
    expect(stderr).to.equal('');
    expect(stdout).to.equal(helpMessage);
  });

  it('when invoking with --help and a command, it should return no error and display help for that command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', '--help', 'build'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
    expect(stderr).to.equal('');
    expect(stdout).to.equal(buildCommandHelp);
  });

  it('when invoking with a command and no main file, it should return an error and display help for that command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'build'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 1 });
    expect(stdout).to.equal('');
    expect(stderr).to
      .equal(`${buildCommandHelp}Not enough non-option arguments: got 0, need at least 1
`);
  });

  it('when invoking with --version it should return no error and display the package version', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', '--version'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
    expect(stdout).to.equal(require('../../package.json').version + '\n');
    expect(stderr).to.equal('');
  });

  it('when invoking with a command, a main file and -d without target it should return an error and display help for the command', async () => {
    const { result, stdout, stderr } = await executeChildProcess(
      'node',
      ['../../bin/monopack.js', 'build', '-d'],
      { cwd: __dirname }
    );

    expect(result).to.deep.equal({ type: 'EXIT', exitCode: 1 });
    expect(stderr).to
      .equal(`${buildCommandHelp}Not enough non-option arguments: got 0, need at least 1
`);
    expect(stdout).to.equal('');
  });
});

const optionsHelp = `Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --watch, -w    Enable watch mode                    [boolean] [default: false]
  --out-dir, -d  Output directory (default into a temp dir)             [string]

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
