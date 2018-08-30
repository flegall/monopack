// @flow
import 'source-map-support/register';
import yargs from 'yargs';

import { main, type MonopackArgs } from './main';

export function run() {
  const commandOption = yargs => {
    yargs.positional('main', {
      describe: 'The application entry point source file',
      type: 'string',
    });
  };
  const { argv } = yargs
    .command('build main', 'Builds an application', commandOption)
    .command('run main', 'Runs an application', commandOption)
    .command('debug main', 'Runs an application in debug mode', commandOption)
    .demandCommand(1, 'You need to enter a command')
    .option('watch', {
      alias: 'w',
      default: false,
      type: 'boolean',
      describe: 'Enable watch mode',
    })
    .option('out-dir', {
      alias: 'd',
      type: 'string',
      describe: 'Output directory (default into a temp dir)',
      nargs: 1,
    })
    .option('no-packages-installation', {
      alias: 'n',
      default: false,
      type: 'boolean',
      describe: 'Do not install packages after build',
    })
    .option('install-packages', {
      alias: 'i',
      default: true,
      type: 'boolean',
      describe: 'Install packages after build',
    })
    .option('with-extra-module', {
      alias: 'm',
      type: 'string',
      describe: `Adds an extra module to the dependencies.
        It can be useful for dynamically required dependencies that monopack cannot detect (e.g.: an sql driver).

        It expects the package name without the version. (e.g: 'mysql' not 'mysql@2.16.0).

        Make sure to install it in the same package as the main file, otherwise another version might be picked up.`,
      nargs: 1,
    })
    .strict();

  const mainJs = argv.main;
  const installPackages = (() => {
    if (argv['install-packages'] && argv['no-packages-installation']) {
      throw new Error(
        '--install-packages && --no-packages-installation are mutually exclusive'
      );
    }
    if (argv['install-packages']) {
      return true;
    }
    if (argv['no-packages-installation']) {
      return false;
    }
    return null;
  })();
  const args: MonopackArgs = {
    command: argv._[0],
    mainJs,
    outputDirectory: argv['out-dir'] || null,
    watch: argv.watch,
    print: text => {
      process.stdout.write(text);
    },
    currentWorkingDirectory: process.cwd(),
    installPackages,
  };

  main(args)
    .then(result => {
      // eslint-disable-next-line promise/always-return
      if (!result.success) {
        process.exit(result.exitCode);
      }
    })
    .catch(error => {
      console.log(error);
      process.exit(1);
    });
}
