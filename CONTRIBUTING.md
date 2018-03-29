# Contributing to monopack

Thanks for taking the time to contribute! :smile:

**You can contribute in many ways:**

* Design/code reviews (if you have time for it, I'd love that to have another point of view on the code, especially the parts that are too complicated to understand so I could focus effort on rewriting / simplifying those parts).
* Code contribution on features/bugs. [Please thoroughly read our writing code guide](#writing-code).
* Advises on features (questionning the planned features for v1.0 and later)
  code examples.
* Promotion on twitter, conferences and so on.
* [Report bugs]https://github.com/flegall/monopack/issues/new) by opening an issue.
* [Request features](https://github.com/flegall/monopack/issues/new) by opening an issue.

## Code of Conduct

All contributors are expecting to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Writing code

### What you need to know before getting started

#### Monopack Packages

This repository is made up of various packages. They are discrete modules with different responsibilities, but each is necessary for monopack and is not necessarily useful outside of it.

Here is a list of the core packages in this repository with a short description, located within the [`packages`](./packages) directory:

| Folder Name                                                               | Purpose                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [cli](./scripts)                                                          | The babel build script                                                                |
| [monopack-builder](./packages/monopack-builder)                           | The actual javascript builder/bundler code (includes the webpack related code)        |
| [monopack-cli](./packages/monopack-cli)                                   | The main CLI code                                                                     |
| [monopack-config](./packages/monopack-config)                             | The config file parser                                                                |
| [monopack-dependency-collector](./packages/monopack-dependency-collector) | The dependency collector algorithm                                                    |
| [monopack-process](./packages/monopack-process)                           | The helper to run system processes (such as yarn or lerna)                            |
| [monopack-repo-builder](./packages/monopack-repo-builder)                 | The DSL to build repositories used in tests                                           |
| [monopack](./packages/monopack)                                           | The entry-point (as it's more convenient to install monopack instead of monopack-cli) |

### Requirements

You must have [`node`](https://nodejs.org/en/) and [`yarn`](https://yarnpkg.com/en/) installed to run the project.

### Getting Started

**Install all dependencies:**

```bash
yarn install
```

This will install this repo's direct dependencies as well as the dependencies for every individual package.

### Tasks

All packages are build from the top of the repo

| Task          | Purpose                              |
| ------------- | ------------------------------------ |
| `build`       | Build the code                       |
| `watch`       | Build the code and watch for changes |
| `test`        | Run all tests                        |
| `eslint`      | Run eslint                           |
| `flow`        | Run flow                             |
| `copyReadmes` | Copiy top README.me to all packages  |
| `release`     | Publish a new version to NPM         |

### Coding Style

We use [prettier](https://prettier.io/) to format all the code and [eslint](https://eslint.org/) & to lint all JavaScript code.

We use [flow](https://flow.org/) to type-check all the code.

Commit hooks are set up to reformat the code, lint the code, typecheck the code and run all the tests when committing.

### Tests

Monopack relies a lot on integration testing, therefore the tests are taking a bit of time as full repositories are created when run.

This repository is exhaustively tested by [Appveyor](https://ci.appveyor.com/project/flegall/monopack/branch/master) [CircleCI](https://circleci.com/gh/flegall/monopack) and [Travis](https://travis-ci.org/flegall/monopack).
