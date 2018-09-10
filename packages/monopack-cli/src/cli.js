// @flow
import 'source-map-support/register';
import _ from 'lodash';
import yargs from 'yargs';

import { main, type MonopackArgs } from './main';

export function run() {
  const { monopackArgs, nodeArgs, runArgs } = splitArgs(process.argv);
  const { argv } = yargs(monopackArgs)
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
        It can be use multiple times "monopack build main.js -m mysql -m postgresql" in order to provide multiple dependencies.

        Make sure to install it in the same package as the main file, otherwise another version might be picked up.`,
      nargs: 1,
    })
    .option('debug-host-port', {
      type: 'string',
      describe: `[host:]port setting to pass to node --inspect option.
      It must be used with the debug command.`,
      nargs: 1,
    })
    .option('debug-break', {
      type: 'boolean',
      describe: `Break at start of main script.
      This option is required when you want to debug something that gets immediately when starting.
      It triggers the --inspect-brk node option.
      It must be used with the debug command.`,
    })
    .strict();

  const command = argv._[0];
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

  const debugOptions = (() => {
    if (argv['debug-host-port'] && command !== 'debug') {
      throw new Error('Error: --debug-host-port requires debug command');
    }
    if (argv['debug-break'] && command !== 'debug') {
      throw new Error('Error: --debug-break requires debug command');
    }
    if (command !== 'debug') {
      return {};
    } else {
      return {
        ...(argv['debug-host-port']
          ? { debugHostPort: argv['debug-host-port'] }
          : {}),
        ...(argv['debug-break'] ? { debugBreak: true } : {}),
      };
    }
  })();

  const extraModules: $ReadOnlyArray<string> = (() => {
    const {
      withExtraModule,
    }: { withExtraModule?: string | $ReadOnlyArray<string> } = argv;
    if (!withExtraModule) {
      return [];
    }
    if (_.isArray(withExtraModule)) {
      return ((withExtraModule: any): $ReadOnlyArray<string>);
    } else {
      return [((withExtraModule: any): string)];
    }
  })();
  const args: MonopackArgs = {
    command,
    mainJs,
    outputDirectory: argv['out-dir'] || null,
    watch: argv.watch,
    print: text => {
      process.stdout.write(text);
    },
    printError: text => {
      process.stderr.write(text);
    },
    currentWorkingDirectory: process.cwd(),
    installPackages,
    extraModules,
    nodeArgs,
    runArgs,
    debugOptions,
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

function commandOption(yargs) {
  return yargs.positional('main', {
    describe: 'The application entry point source file',
    type: 'string',
  });
}

export function splitArgs([_1, _2, ...args]: $ReadOnlyArray<string>): {|
  +monopackArgs: $ReadOnlyArray<string>,
  +runArgs: $ReadOnlyArray<string>,
  +nodeArgs: $ReadOnlyArray<string>,
|} {
  const firstDoubleColon = args.indexOf('::');
  if (firstDoubleColon === -1) {
    return { monopackArgs: args, nodeArgs: [], runArgs: [] };
  }
  const monopackArgs = args.slice(0, firstDoubleColon);

  const secondDoubleColon = args.indexOf('::', firstDoubleColon + 1);
  if (secondDoubleColon === -1) {
    return {
      monopackArgs,
      runArgs: args.slice(firstDoubleColon + 1),
      nodeArgs: [],
    };
  }

  return {
    monopackArgs,
    runArgs: args.slice(firstDoubleColon + 1, secondDoubleColon),
    nodeArgs: args.slice(secondDoubleColon + 1),
  };
}
