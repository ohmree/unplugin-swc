import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import { assert, test } from 'vitest';
import swc from '..';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(...args: string[]) {
  return path.join(__dirname, 'fixtures', ...args);
}

test('rollup', async () => {
  const bundle = await rollup({
    input: fixture('rollup/index.ts'),
    plugins: [
      swc.rollup({
        tsconfigFile: false,
      }),
    ],
  });

  const { output } = await bundle.generate({
    format: 'cjs',
    dir: fixture('rollup/dist'),
  });

  assert.strictEqual(
    output[0].code,
    `'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var foo = 'foo';

exports.foo = foo;
`,
  );
});

test('read tsconfig', async () => {
  const bundle = await rollup({
    input: fixture('read-tsconfig/index.tsx'),
    plugins: [swc.rollup()],
  });

  const { output } = await bundle.generate({
    format: 'cjs',
    dir: fixture('read-tsconfig/dist'),
  });

  const code = output[0].code;
  assert.match(code, /customJsxFactory/);

  try {
    // NOTE: use tsconfig.base.json which experimentalDecorators turned off will throw
    await rollup({
      input: fixture('read-tsconfig/index.tsx'),
      plugins: [swc.rollup({ tsconfigFile: 'tsconfig.base.json' })],
    });
  } catch (e) {
    assert.instanceOf(e, Error);
    assert.match((e as Error).toString(), /Unexpected token `@`./);
  }
});

test('custom swcrc', async () => {
  const bundle = await rollup({
    input: fixture('custom-swcrc/index.tsx'),
    plugins: [
      swc.rollup({
        tsconfigFile: false,
      }),
    ],
  });

  const { output } = await bundle.generate({
    format: 'cjs',
    dir: fixture('custom-swcrc/dist'),
  });

  const code = output[0].code;
  assert.match(code, /customPragma/);
});

test('minify', async () => {
  const bundle = await rollup({
    input: fixture('minify/index.ts'),
    plugins: [
      swc.rollup({
        minify: true,
      }),
    ],
  });

  const { output } = await bundle.generate({
    format: 'cjs',
    dir: fixture('minify/dist'),
  });

  const code = output[0].code;
  assert.match(code, /var Foo=function Foo(){_classCallCheck(this,Foo);this.a=1}/);
});
