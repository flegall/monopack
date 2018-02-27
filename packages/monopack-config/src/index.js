// @flow
export type MonopackConfig = {
  monorepoRootPath: string,
  webpackConfigModifier: Object => Object,
  babelConfigModifier: Object => Object,
};

export async function getMonopackConfig(
  mainFilePath: string
): Promise<MonopackConfig> {
  throw new Error();
}
