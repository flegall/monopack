// @flow

type ExternalDependency = {
  +packageName: string,
  +context: string,
};
type ImportMatch =
  | { +type: 'INLINE' }
  | { +type: 'IMPORT', +externalDependency?: ExternalDependency };

export function importMatcher(
  request: string,
  context: string,
  mainJs: string,
  monorepoPackages: string[]
): ImportMatch {
  if (request === mainJs) {
    return { type: 'INLINE' };
  }

  if (request.startsWith('.')) {
    return { type: 'INLINE' };
  }

  if (
    monorepoPackages.some(monorepoPackage =>
      matchPackage(request, monorepoPackage)
    )
  ) {
    return { type: 'INLINE' };
  }

  const extractedPackage = extractPackage(request);

  if (extractedPackage) {
    if (NODE_JS_PACKAGES.includes(extractedPackage)) {
      return { type: 'IMPORT' };
    } else {
      return {
        type: 'IMPORT',
        externalDependency: { context, packageName: extractedPackage },
      };
    }
  }

  throw new Error('Cannot extract package name from ' + request);
}

function matchPackage(request: string, packageName: string): boolean {
  const extractedPackage = extractPackage(request);
  if (!extractedPackage) {
    return false;
  } else {
    return extractedPackage === packageName;
  }
}

function extractPackage(request: string): string | null {
  const regexp = /^([^/]*)\/?/;
  const result = request.match(regexp);
  if (!result || result.length < 2) {
    return null;
  } else {
    return result[1];
  }
}

const NODE_JS_PACKAGES = ((require('repl'): any): { _builtinLibs: string[] })
  ._builtinLibs;
