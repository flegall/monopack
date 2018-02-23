# Monopack

A JavaScript bundler for node.js monorepo-codebased applications.

![Quality](https://img.shields.io/badge/quality-vaporware-yellow.svg)

## Why such a tool ?

This tool comes to fill a gap for node.js developpers who :

* are building node.js applications (micro-services, monolithic servers or client applications)
* are using a monorepo codebase.
* are performing continuous integration/deployment.

Monopack aims to build **a static deterministic deliverable bundle** from your application's entrypoint **main.js**.

It will build:

* **a single main.js** file that bundles all the imported sources from the monorepo.
* **a package.json and a yarn.lock** files including **only** the required third-party dependencies.
* **optionally**: the **node_modules directory** for these dependencies.

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
  * It forces you to perform continous integration. This is generally a very good thing, but it requires some maturity within your team and your test/release process. Of course nothing forces you to perform continous integration, but I think that releasing a mono-repo without a decent automated testing strategy is quite risky !
* Cons:
  * Codebase looks more intimidating.
  * Repo is bigger in size.

Unfortunately, this is not currently a very popular trend amongst many Node.JS developpers and micro-services developpers.

The classical tooling in Node.JS is designed for delivering open-source libraries and not organizing for mono-repos :

* NPM initially did not provide a way to have multiple package.json within the same repository and create dependencies between then.
* [LernaJS](https://lernajs.io/) proposed a way to support mono-repos for open-source libraries.
* [Yarn](https://yarnpkg.com/lang/en/docs/workspaces/) proposes workspaces which makes dependency management convenient on a mono-repo.

When deploying a node.js application (either within a container, or within a PAAS or on physical/virtual machine), you would like to rely on NPM/Yarn to install the application dependencies and rely on your "start" script to execute your application.

But how do bundle your application from your mono-repo sources to a static deliverable package ? That's the purpose of monopack !

### Some alternatives

You can used versions and make [LernaJS](https://lernajs.io/) manage versions :

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
  * You could use [Webpack](https://webpack.js.org/) to bundle your main.js entrypoint and rely on [Node externals](https://www.npmjs.com/package/webpack-node-externals) to avoid packaging the node_modules in webpack. Actually that's what [Backpack](https://github.com/jaredpalmer/backpack) does.
    * This will generate a single main.js file that bundles all the imported sources from the mono-repo.

## Design ideas

### Build

* Build the main.js bundle using [Webpack](https://webpack.js.org/)
  * By default, it should compile with babel and provide source maps.
* Collect all the used external dependencies during the webpack build process.
  * For each dependency required, get its exact dependency from package.json & yarn.lock files.
  * If several version of the same dependency are found accross the mono-repo, report it as an error and ask the developper to fix it
    * This is not easily fixable.
      * Monopack first intend is to have a static js bundle.
      * We could perform code splitting and creating a bundle for each monorepo module, but frankly this is too much much in my opinion.
* Generate a package.json including all required external dependencies.
* Copy the mono-repo yarn.lock dependency
* (Optionally) Install the node_modules dependencies

Note :

* This will be deterministic if and only if yarn workspaces are used !
  * Otherwise the mono-repo yarn.lock file will not include all dependencies.

### Watch

* Provide a way to run/debug the application using webpack's watch mode.

### Deliverable

It should be deliverable as a CLI tool:

* That can be installed globally
* That uses the local installed versions if found.

### Configuration files

A configuration file could be optionally used :

* It will a javascript file
* It will allow overriding the babel Configuration and the webpack Configuration
* One configuration file could be used for the whole mono-repo.
