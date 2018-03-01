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
    .strict();

  const mainJs = argv.main;
  const args: MonopackArgs = {
    command: argv._[0],
    mainJs,
    outputDirectory: argv['out-dir'] || null,
    watch: argv.watch,
    println: text => {
      process.stdout.write(text);
    },
    currentWorkingDirectory: process.cwd(),
  };

  main(args).catch(error => {
    console.log(error);
    process.exit(1);
  });
}
