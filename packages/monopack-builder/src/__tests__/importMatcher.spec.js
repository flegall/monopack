// @flow
import { expect } from 'chai';

import { importMatcher } from '../importMatcher';

describe('importMatcher', () => {
  it('the mainJs file must be inlined', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher(mainJs, context, mainJs, []);

    expect(match).to.deep.equal({ type: 'INLINE' });
  });

  it('a local file mainJs file must be inlined', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('./module.js', context, mainJs, []);

    expect(match).to.deep.equal({ type: 'INLINE' });
  });

  it('a monorepo package must be inlined', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('my-super-lib', context, mainJs, [
      'my-super-lib',
    ]);

    expect(match).to.deep.equal({ type: 'INLINE' });
  });

  it('a module within a monorepo package must be inlined', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('my-super-lib/file', context, mainJs, [
      'my-super-lib',
    ]);

    expect(match).to.deep.equal({ type: 'INLINE' });
  });

  it('a request to a nodejs package must be imported and no dependency should be provided', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('path', context, mainJs, []);

    expect(match).to.deep.equal({ type: 'IMPORT' });
  });

  it('a module within nodejs package must be imported and no dependency should be provided', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('path/module', context, mainJs, []);

    expect(match).to.deep.equal({ type: 'IMPORT' });
  });

  it('a third party library must be imported and a dependency should be provided', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('third-party', context, mainJs, [
      'my-super-lib',
    ]);

    expect(match).to.deep.equal({
      type: 'IMPORT',
      externalDependency: {
        packageName: 'third-party',
        context: '/home/repo',
      },
    });
  });

  it('a module within third party library must be imported and a dependency should be provided', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('third-party/module', context, mainJs, [
      'my-super-lib',
    ]);

    expect(match).to.deep.equal({
      type: 'IMPORT',
      externalDependency: {
        packageName: 'third-party',
        context: '/home/repo',
      },
    });
  });

  it('a scoped third party library must be imported and a dependency should be provided', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('@scope/third-party', context, mainJs, [
      'my-super-lib',
    ]);

    expect(match).to.deep.equal({
      type: 'IMPORT',
      externalDependency: {
        packageName: '@scope/third-party',
        context: '/home/repo',
      },
    });
  });

  it('a scoped third party library module must be imported and a dependency should be provided', () => {
    const mainJs = '/home/repo/main.js';
    const context = '/home/repo';

    const match = importMatcher('@scope/third-party/module', context, mainJs, [
      'my-super-lib',
    ]);

    expect(match).to.deep.equal({
      type: 'IMPORT',
      externalDependency: {
        packageName: '@scope/third-party',
        context: '/home/repo',
      },
    });
  });
});
