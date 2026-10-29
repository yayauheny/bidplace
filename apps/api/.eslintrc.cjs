module.exports = {
  root: true,
  ignorePatterns: ['dist'],
  extends: ['../../packages/eslint-config'],
  overrides: [
    {
      files: ['src/**/*.ts', 'test/**/*.ts'],
      excludedFiles: ['src/antifraud/**/*.ts', 'test/integration/auth-abuse.integration.spec.ts', 'test/integration/abuse-request.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: ['**/antifraud/**', '!**/antifraud/index'],
            message: 'Use the public antifraud entrypoint.',
          }],
        }],
      },
    },
  ],
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
};
