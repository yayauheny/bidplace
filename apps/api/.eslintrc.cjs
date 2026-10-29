module.exports = {
  root: true,
  ignorePatterns: ['dist'],
  extends: ['../../packages/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
};
