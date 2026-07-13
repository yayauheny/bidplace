module.exports = {
  root: true,
  ignorePatterns: ['dist', '.expo', 'node_modules', 'babel.config.js', 'metro.config.js'],
  extends: ['../../packages/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    'import/namespace': 'off',
  },
};
