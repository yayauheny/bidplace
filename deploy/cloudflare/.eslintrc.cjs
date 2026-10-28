module.exports = {
  extends: ['../../packages/eslint-config'],
  env: { browser: true },
  globals: { caches: 'readonly' },
  ignorePatterns: ['.wrangler'],
};
