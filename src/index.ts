import path from 'path';
import defu from 'defu';
import { type UnpluginOptions, createUnplugin } from 'unplugin';
import { createFilter } from '@rollup/pluginutils';
import { loadTsConfig } from 'load-tsconfig';

import { type JscConfig, type JscTarget, transform } from '@swc/core';
import type { SourceMapInput } from 'rollup';
import { resolveId } from './resolve';
import type { Options } from './types';

function createRollupPlugin(minify?: boolean) {
  return {
    async renderChunk(code, chunk) {
      if (minify) {
        const result = await transform(code, {
          sourceMaps: true,
          minify: true,
          filename: chunk.fileName,
        });
        return {
          code: result.code,
          map: result.map,
        };
      }
      return null;
    },
  } satisfies UnpluginOptions['rollup'];
}

export default createUnplugin(
  ({ tsconfigFile, minify, include, exclude, ...options }: Options = {}) => {
    const filter = createFilter(include || /\.[jt]sx?$/, exclude || /node_modules/);
    const rollupPlugin = createRollupPlugin(minify);
    return {
      name: 'swc',

      resolveId,

      async transform(code, id) {
        if (!filter(id)) {
          return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const compilerOptions: Record<string, unknown> =
          tsconfigFile === false
            ? {}
            : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              loadTsConfig(path.dirname(id), tsconfigFile === true ? undefined : tsconfigFile)?.data
                ?.compilerOptions ?? {};

        const isTs = /\.tsx?$/.test(id);

        let jsc: JscConfig = {
          parser: {
            syntax: isTs ? 'typescript' : 'ecmascript',
          },
          transform: {},
        };

        if (compilerOptions.jsx != null) {
          Object.assign(jsc.parser!, {
            [isTs ? 'tsx' : 'jsx']: true,
          });
          Object.assign(jsc.transform!, {
            react: {
              pragma: compilerOptions.jsxFactory,
              pragmaFrag: compilerOptions.jsxFragmentFactory,
              importSource: compilerOptions.jsxImportSource,
            },
          });
        }

        if (compilerOptions.experimentalDecorators) {
          // class name is required by type-graphql to generate correct graphql type
          jsc.keepClassNames = true;
          Object.assign(jsc.parser!, {
            decorators: true,
          });
          Object.assign(jsc.transform!, {
            legacyDecorator: true,
            decoratorMetadata: compilerOptions.emitDecoratorMetadata,
          });
        }

        if (compilerOptions.target != null) {
          jsc.target = compilerOptions.target as JscTarget;
        }

        if (options.jsc) {
          jsc = defu(options.jsc, jsc);
        }

        const result = await transform(code, {
          filename: id,
          sourceMaps: true,
          ...options,
          jsc,
        });
        return {
          code: result.code,
          map: result.map && (JSON.parse(result.map) as SourceMapInput),
        };
      },

      vite: {
        ...rollupPlugin,
        config() {
          return {
            esbuild: false,
          };
        },
      },

      rollup: rollupPlugin,
    };
  },
);
