# Monopack

A JavaScript bundler for node.js monorepo-codebased applications.

[![Build Status](https://travis-ci.org/flegall/monopack.svg?branch=master)](https://travis-ci.org/flegall/monopack)
[![Build Status](https://circleci.com/gh/flegall/monopack.svg?style=shield)](https://circleci.com/gh/flegall/monopack)
[![Build status](https://ci.appveyor.com/api/projects/status/4xrx5hu4cxvyme0c/branch/master?svg=true)](https://ci.appveyor.com/project/flegall/monopack/branch/master)

![Quality](https://img.shields.io/badge/quality-alpha-tomato.svg) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

This tool comes to fill a gap for node.js developpers who :

* are building node.js applications (serverless functions, micro-services, monolithic servers or client applications)
* are using a monorepo codebase.
* are performing continuous integration/deployment.

Monopack aims to build **a static deterministic deliverable bundle** from your application's entrypoint **main.js**.

It will build:

* **a single main.js** file that bundles all the imported sources from the monorepo.
* **package.json and yarn.lock** files including **only** the used third-party dependencies.
* the **node_modules directory** for these dependencies.

## Usage

### Requirements

* Node.js >= 6.10
* Yarn >= 1.3.2 :
  * Yarn is required to be present for installing the produced dependencies.
  * It is not mandatory for your project to use it, but bear in mind that the dependencies collection will be deterministic only if your projet uses Yarn.

### Installation

It can be installed globally and locally

#### Global installation

Using yarn

    yarn global add monopack

Or npm

    npm install -g monopack

You can then use it with

    $ monopack

#### Local installation

Using yarn

    yarn add -D monopack

Or npm

    npm install --save-dev monopack

You can then use it on your project

With yarn

    $ yarn run monopack

With npm

    ./node_modules/.bin/monopack

### CLI

    monopack <command>

    Commands:
      monopack build main  Builds an application

    Options:
      --help         Show help                                             [boolean]
      --version      Show version number
      --out-dir, -d  Output directory (default into a temp dir)             [string]

### Default configuration

By default monopack will use babel 6 to compile your code into js code that node.js 6.10 understands.
It supports [flow](https://flow.org) and [stage-2](https://babeljs.io/docs/plugins/preset-stage-2/) features.

```js
const baseBabelConfig = {
  presets: [
    [
      require.resolve('babel-preset-env'),
      {
        targets: {
          node: '6.10',
        },
      },
    ],
    require.resolve('babel-preset-flow'),
    require.resolve('babel-preset-stage-2'),
  ],
};
```

Monopack will use webpack 4 to produce the bundle.
The bundle is produced in 'development' mode in order not to obfuscate the code.
Source maps are included.

### Configuration file

You can include an optional configuration file : **monopack.config.js**

This configuration file can be used to :

* Define the monorepo root
* Override the default babel configuration
* Override the default webpack configuration

If you use a configuration file, monopack will use its path as the monorepo root. You can override it with the **monorepoRootPath** field.

The config file can export 3 entries :

* monorepoRootPath : the relative path to the monorepo root.
* babelConfigModifier : a function that takes the current configuration and returns the modified configuration.
* webpackConfigModifier: a function that takes the current configuration and returns the modified configuration.

For example :

```js
module.exports.monorepoRootPath = '../..';
module.exports.babelConfigModifier = defaultBabelConfiguration => {
  return babelConfiguration(defaultBabelConfiguration);
};
module.exports.webpackConfigModifier = defaultWebpackConfig => {
  return webPackConfiguration(defaultWebpackConfig);
};
```

I encourage you not to modify the webpack configuration, as I intend to keep in track with latest webpack versions, having a custom webpack configuration will be difficult to update on your side.
If you have specific needs that require a customization please [open an issue](https://github.com/flegall/monopack/issues/new)

### Dependencies handling

Monopack will collect:

* all used dependencies (dependencies actually **imported** or **required()**).
* all peer dependencies of your used dependencies.

All the dependencies are collected, a package.json with the collected dependencies will be compiled.

Your project's yarn.lock will be copied if it exists.
If you are using multiple yarn.lock files, only the top-most one will be copied.

The dependencies collection is **deterministic** only if you have a single yarn.lock file.
In order to achieve that you can :

* Use [yarn's workspaces](https://yarnpkg.com/lang/en/docs/workspaces/)
* Declare your dependencies in a single package.json file.

## Why such a tool ?

As far as I know such a tool does not exist so far.

### Monorepos and node.js

[Many developpers](https://github.com/babel/babel/blob/master/doc/design/monorepo.md#previous-discussion) (me included) tend to consider that the only viable way of performing continous integration is to use a monorepo.

I personally find it very practical :

* Pros:
  * Code sharing is **a lot easier**
  * You have a **single lint, build, test and release process**.
  * It's **easy to coordinate changes** across modules.
  * It's easier to setup a development environment.
  * Tests across modules are ran together which finds bugs that touch multiple modules easier.
* Median:
  * It forces you to perform continous integration. This is generally a very good thing, but it requires some maturity within your team and your test/release process. Of course a mono-repo does not force you to perform continous integration, but I think that releasing frequently from a mono-repo without a decent automated testing strategy is quite risky !
* Cons:
  * Codebase looks more intimidating.
  * Repo is bigger in size.

Unfortunately, this is not currently a very popular trend amongst many Node.JS developpers and micro-services developpers.

The classical tooling in Node.JS is designed for delivering open-source libraries and not organizing for mono-repos :

* NPM initially did not provide a way to have multiple package.json within the same repository and create dependencies between then.
* [LernaJS](https://lernajs.io/) proposed a way to support mono-repos for open-source libraries.
* [Yarn](https://yarnpkg.com/lang/en/docs/workspaces/) proposes workspaces which makes dependency management convenient on a mono-repo.

When deploying a node.js application (either within a container, or within a PAAS or on physical/virtual machine), you would like to rely on NPM/Yarn to install the application dependencies and rely on your "start" script to execute your application.

But how to bundle your application from your mono-repo sources to a static deliverable package ?

That's the purpose of monopack !

### Some alternatives

You can usedversions and make [LernaJS](https://lernajs.io/) manage versions :

* You would:
  * bundle each of your monorepo internal dependencies as a Lerna package (optionally, you can bundle the package with babel or webpack),
  * update the versions, like you would do for open-source software
  * publish each version to a private registry.
* This is maybe acceptable if you do not intend to perform continuous integration / continuous deployment (ci/cd) as Lerna can help you to automate publication.
* If you're performing ci/cd, updating the versions for building a new version is a pain you do not want to have or automate.
* It also makes your execution environment in development quite different from your release execution, as you would use symlinked modules in your run/debug environment and published modules in your release execution.

You could bring your whole monorepo in your application release :

* This will work, but it's not optimal:
  * it will include all your source and will require all your monorepo node_modules, it will increase your deployment time & cost. On one of my previous job, we relied on this, we ended up bundling react-native in each of our node.js's microservice's docker image :(
* If you are compiling your javascript code (using flow, typescript, or unsupported ES features: you still have to compile your code :

  * You could use [babel-node](https://babeljs.io/docs/usage/cli/#babel-node) to execute your main.js file. Babel-node will compile it on the fly.

    * This works, but it's not optimal, it requires a lot more memory in order to compile, startup time is increased, and as stated on [babel-node](https://babeljs.io/docs/usage/cli/#babel-node) : _"You should not be using babel-node in production"_

  * You could use [Webpack](https://webpack.js.org/) to bundle your main.js entrypoint and bundle all your used dependencies like you would do with web bundles.

    * Theorically this will work, however in practice it doesn't work, as some node.js modules are not designed to work like this :
      * Some modules rely on non-constant require() calls, so they won't be bundled
      * Some modules actually load some config files at runtime time using \_\_filename or \_\_dirname, and therefore the bundle will only work on the machine they were build.

  * You could use [Webpack](https://webpack.js.org/) to bundle your main.js entrypoint and rely on [Node externals](https://www.npmjs.com/package/webpack-node-externals) to avoid packaging the node_modules in webpack. Actually that's what [Backpack](https://github.com/jaredpalmer/backpack) does.
    * This will generate a single main.js file that includes only the sources that are imported. This is what monopack does, but you will still have to install all your monorepo dependencies.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md)

## Roadmap

See [issues labelled as enhancement](https://github.com/flegall/monopack/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement)
