import type { FilterPattern } from '@rollup/pluginutils';
import type { Options as SwcOptions } from '@swc/core';

export type Options = SwcOptions & {
  include?: FilterPattern;
  exclude?: FilterPattern;
  tsconfigFile?: string | boolean;
};
