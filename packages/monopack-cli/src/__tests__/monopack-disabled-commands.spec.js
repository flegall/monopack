// @flow
import { expect } from 'chai';

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
    });

    expect(result).to.deep.equal({
      success: false,
      exitCode: -1,
    });
    expect(buffer).to.have.string('--watch toggle is not implemented yet !');
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
    });

    expect(result).to.deep.equal({
      success: false,
      exitCode: -1,
    });
    expect(buffer).to.have.string('run command is not implemented yet !');
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
    });

    expect(result).to.deep.equal({
      success: false,
      exitCode: -1,
    });
    expect(buffer).to.have.string('debug command is not implemented yet !');
  });
});
