module.exports = {
  root: true,
  ignorePatterns: ['dist'],
  extends: ['../../packages/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
};
