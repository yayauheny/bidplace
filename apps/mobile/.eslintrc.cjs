module.exports = {
  root: true,
  ignorePatterns: ['dist', '.expo', 'node_modules', 'babel.config.js', 'metro.config.js', 'tailwind.config.js'],
  extends: ['../../packages/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    'import/namespace': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'expo-router/build',
            message:
              'No deep expo-router imports. Remove usePreventRemove (Wave 4) or use the public API.',
          },
          {
            name: 'lucide-react-native',
            message: 'Use FigmaIcon instead. Dependency removal is scheduled for the dedup wave.',
          },
          {
            name: 'react-native',
            importNames: ['Modal', 'TouchableOpacity', 'TouchableHighlight'],
            message: 'Sheets go through AppDialog; use Pressable for touch targets.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Grandfathered debt: ratchet allowlist, removed wave by wave.
      files: [
        'src/lib/category-query-identity.spec.ts',
        'src/features/sellers/author-cabinet-work-cache.spec.ts',
        'src/components/layout/AuthViewport.tsx',
        'src/features/sellers/product-draft-submit-lifecycle.spec.ts',
        'src/features/sellers/product-draft-save-race.spec.ts',
        'src/features/sellers/product-draft-route-guard.spec.ts',
        'src/features/sellers/product-draft-screen.tsx',
        'src/components/ui/AppIcon.tsx',
        'src/features/search/search-overlay-surface.tsx',
      ],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};
