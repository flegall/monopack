// @flow
import tmp from 'tmp-promise';

let repositoryCount = 0;

opaque type Dir = { cleanup: () => any };

type Monorepo = {
  root: string,
  packages: string[],
  dir: Dir,
};

class Package {
  name: null | string = `package-${repositoryCount++}`;
  configFile: null | (() => string) = null;
  packages: Package[] = [];

  named(name: string): this {
    this.name = name;
    return this;
  }

  withDefaultConfigFile(): this {
    this.configFile = () => 'module.exports = {}';
    return this;
  }

  withPackages(...packages: Package[]): this {
    this.packages = packages;
    return this;
  }

  async then(actionOnMonorepo: Monorepo => Promise<void>): Promise<void> {
    const monorepo = await this._build();
    try {
      await actionOnMonorepo(monorepo);
    } finally {
      await this._cleanup(monorepo);
    }
  }

  async _build(): Promise<Monorepo> {
    const dir = await tmp.dir();
    const { path } = dir;
    return { root: path, packages: [], dir };
  }

  async _cleanup(monorepo: Monorepo): Promise<void> {
    await monorepo.dir.cleanup();
  }
}

export function aMonorepo(): Package {
  return new Package();
}

export function aPackage(): Package {
  return new Package();
}
