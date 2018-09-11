// @flow

// capture terminal output, so that we might
// assert against it.
export function checkOutput<T>(
  f: (argv: string[]) => T,
  argv: string[],
  cb: void
): {|
  logs: $ReadOnlyArray<string>,
  warnings: $ReadOnlyArray<string>,
  errors: $ReadOnlyArray<string>,
  exit: null | number,
  result: T,
|} {
  let exit = null;
  const _exit = process.exit;
  const _emit = process.emit;
  const _env = process.env;
  const _argv = process.argv;
  const _error = console.error;
  const _log = console.log;
  const _warn = console.warn;

  // $FlowIgnore
  process.exit = exitCode => {
    exit = exitCode;
  };
  process.env = { ...process.env, ...{ _: 'node' } };
  process.argv = argv;

  const errors = [];
  const logs = [];
  const warnings = [];

  // $FlowIgnore
  console.error = msg => {
    errors.push(msg);
  };
  // $FlowIgnore
  console.log = msg => {
    logs.push(msg);
  };
  // $FlowIgnore
  console.warn = msg => {
    warnings.push(msg);
  };

  let result: T;

  try {
    result = f(argv);
  } finally {
    reset();
  }

  return done();

  function reset() {
    // $FlowIgnore
    process.exit = _exit;
    // $FlowIgnore
    process.emit = _emit;
    process.env = _env;
    process.argv = _argv;

    // $FlowIgnore
    console.error = _error;
    // $FlowIgnore
    console.log = _log;
    // $FlowIgnore
    console.warn = _warn;
  }

  function done() {
    reset();

    return {
      errors,
      logs,
      warnings,
      exit,
      result,
    };
  }
}
