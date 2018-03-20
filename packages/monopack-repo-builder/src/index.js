// @flow
import fs from 'fs';
import path from 'path';

import Bluebird from 'bluebird';
import tmp from 'tmp-promise';

import {
  executeChildProcessOrFail,
  type ExecuteChildResult,
  YARN_COMMAND,
} from 'monopack-process';

const writeFile: (
  string | Buffer | number,
  string | Buffer | Uint8Array,
  Object | string | void
) => Promise<void> = Bluebird.promisify(fs.writeFile);

const mkdir: (
  string | Buffer | URL,
  number | void
) => Promise<void> = Bluebird.promisify(fs.mkdir);

const realpath: string => Promise<string> = Bluebird.promisify(fs.realpath);

let repositoryCount = 0;

opaque type Dir = { path: string, cleanup: () => any };

type Monorepo = {
  root: string,
  packages: string[],
  dir: Dir,
};

class Package {
  name: string = `package-${repositoryCount++}`;
  configFile: null | (() => string) = null;
  lernaJsonfile: null | (() => string) = null;
  packages: Package[] = [];
  useWorkspaces: boolean = false;
  dependencies: { [string]: string } = {};
  devDependencies: { [string]: string } = {};
  sources: { [string]: () => string } = {};

  named(name: string): this {
    this.name = name;
    return this;
  }

  withEmptyConfigFile(): this {
    this.configFile = () => `module.exports = {};`;
    return this;
  }

  withConfigFile(configFileContent: string): this {
    this.configFile = () => configFileContent;
    return this;
  }

  withLernaJsonFile(): this {
    this.lernaJsonfile = () => `{
      "lerna": "2.9.0",
      "packages": [
        "packages/*"
      ],
      "version": "1.0.0",
      "npmClient": "yarn"
    }
`;
    return this;
  }

  withWorkspacesEnabled(): this {
    this.useWorkspaces = true;
    return this;
  }

  withDependencies(dependencies: { [string]: string }): this {
    this.dependencies = dependencies;
    return this;
  }

  withDevDependencies(devDependencies: { [string]: string }): this {
    this.devDependencies = devDependencies;
    return this;
  }

  withPackages(...packages: Package[]): this {
    this.packages = packages;
    return this;
  }

  withSource(sourceFileName: string, sourceContent: string): this {
    this.sources[sourceFileName] = () => sourceContent;
    return this;
  }

  async execute(actionOnMonorepo: Monorepo => Promise<void>): Promise<void> {
    const dir = await this._createTempDir();
    const monorepo = await this._buildPackage(dir.path, dir, true);
    try {
      await actionOnMonorepo(monorepo);
    } finally {
      await this._cleanup(dir);
    }
  }

  async _createTempDir(): Promise<Dir> {
    const dir = await tmp.dir({ unsafeCleanup: true });
    return { ...dir, path: await realpath(dir.path) };
  }

  async _buildPackage(
    packagePath: string,
    dir: Dir,
    installDeps: boolean
  ): Promise<Monorepo> {
    const packageJsonContent: {
      version: string,
      name: string,
      private: true,
      workspaces?: string[],
      dependencies: { [string]: string },
      devDependencies: { [string]: string },
    } = {
      version: '1.0.0',
      name: this.name,
      private: true,
      dependencies: this.dependencies,
      devDependencies: this.devDependencies,
    };
    if (this.lernaJsonfile) {
      packageJsonContent.devDependencies['lerna'] = '2.9.0';
    }
    if (this.useWorkspaces) {
      packageJsonContent.workspaces = ['packages/*'];
    }

    await writeFile(
      path.join(packagePath, 'package.json'),
      JSON.stringify(packageJsonContent, null, 2)
    );

    if (this.configFile) {
      const { configFile } = this;
      await writeFile(
        path.join(packagePath, '/monopack.config.js'),
        configFile()
      );
    }

    if (this.lernaJsonfile) {
      const { lernaJsonfile } = this;
      await writeFile(path.join(packagePath, '/lerna.json'), lernaJsonfile());
    }

    for (const source in this.sources) {
      await writeFile(path.join(packagePath, source), this.sources[source]());
    }

    if (this.packages.length > 0) {
      await mkdir(path.join(packagePath, 'packages'));
    }
    const packages = [];
    for (const pkg of this.packages) {
      const subPackagePath = path.join(packagePath, '/packages/', pkg.name);
      await mkdir(subPackagePath);
      await pkg._buildPackage(
        subPackagePath,
        dir,
        this.useWorkspaces === false && this.lernaJsonfile === null
      );
      packages.push(subPackagePath);
    }

    if (
      installDeps &&
      (Object.keys(packageJsonContent.dependencies).length > 0 ||
        Object.keys(packageJsonContent.devDependencies).length > 0 ||
        this.useWorkspaces)
    ) {
      await executeYarn(packagePath);
    }

    if (this.lernaJsonfile) {
      await executeYarn(packagePath, 'lerna', 'bootstrap');
    }

    return { root: packagePath, packages, dir };
  }

  async _cleanup(dir: Dir): Promise<void> {
    await dir.cleanup();
  }
}

export function aMonorepo(): Package {
  return new Package();
}

export function aPackage(): Package {
  return new Package();
}

function executeYarn(
  cwd: string,
  ...args: string[]
): Promise<ExecuteChildResult> {
  return executeChildProcessOrFail(YARN_COMMAND, args, {
    cwd,
  });
}
