const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  extends: ['@antfu', 'prettier'],
  rules: { 'no-console': ['error', { allow: ['assert', 'trace', 'debug'] }] },
  overrides: [
    {
      files: '**/*.cjs',
      rules: { '@typescript-eslint/no-var-requires': 'off' },
    },
  ],
});
