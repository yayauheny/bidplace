module.exports = {
  root: true,
  ignorePatterns: ['dist', 'src/**/*.spec.ts', 'vitest.config.ts'],
  extends: ['../../packages/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
};
