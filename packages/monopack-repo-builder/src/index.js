// @flow
import fs from 'fs';

import Bluebird from 'bluebird';
import tmp from 'tmp-promise';

const writeFile: (
  string | Buffer | number,
  string | Buffer | Uint8Array,
  Object | string | void
) => Promise<void> = Bluebird.promisify(fs.writeFile);

const mkdir: (
  string | Buffer | URL,
  number | void
) => Promise<void> = Bluebird.promisify(fs.mkdir);

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

  named(name: string): this {
    this.name = name;
    return this;
  }

  withEmptyConfigFile(): this {
    this.configFile = () => 'module.exports = {};';
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
      "version": "0.0.9",
      "npmClient": "yarn",
      "useWorkspaces": true
    }
`;
    return this;
  }

  withWorkspacesEnabled(): this {
    this.useWorkspaces = true;
    return this;
  }

  withPackages(...packages: Package[]): this {
    this.packages = packages;
    return this;
  }

  async execute(actionOnMonorepo: Monorepo => Promise<void>): Promise<void> {
    const dir = await this._createTempDir();
    const monorepo = await this._buildPackage(dir.path, dir);
    try {
      await actionOnMonorepo(monorepo);
    } finally {
      await this._cleanup(dir);
    }
  }

  _createTempDir(): Promise<Dir> {
    return tmp.dir({ unsafeCleanup: true });
  }

  async _buildPackage(path: string, dir: Dir): Promise<Monorepo> {
    const packageJsonContent = this.useWorkspaces
      ? `{
    "name": "${this.name}",
    "private": true,
    "workspaces": ["packages/*"]
  }`
      : `{
    "name": "${this.name}",
    "private": true
  }`;
    await writeFile(path + '/package.json', packageJsonContent);

    if (this.configFile) {
      await writeFile(path + '/monopack.config.js', this.configFile());
    }

    if (this.lernaJsonfile) {
      await writeFile(path + '/lerna.json', this.lernaJsonfile());
    }

    if (this.packages.length > 0) {
      await mkdir(path + '/packages');
    }
    const packages = [];
    for (const pkg of this.packages) {
      const packagePath = path + '/packages/' + pkg.name;
      await mkdir(packagePath);
      await pkg._buildPackage(packagePath, dir);
      packages.push(packagePath);
    }

    return { root: path, packages, dir };
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
