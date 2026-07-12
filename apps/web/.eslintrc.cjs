module.exports = {
  root: true,
  ignorePatterns: ['.next', 'dist', 'next-env.d.ts'],
  extends: ['../../packages/eslint-config', 'next/core-web-vitals'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
};
