module.exports = {
  root: true,
  ignorePatterns: [
    'dist',
    '.expo',
    'node_modules',
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
  ],
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
            message:
              'Use FigmaIcon instead. Dependency removal is scheduled for the dedup wave.',
          },
          {
            name: 'react-native',
            importNames: ['Modal', 'TouchableOpacity', 'TouchableHighlight'],
            message:
              'Sheets go through AppDialog; use Pressable for touch targets.',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
        message:
          'Colors come from designTokens. Hex literals are allowed only in packages/design-tokens and the brand SVG file.',
      },
    ],
  },
  overrides: [
    {
      // Specs legitimately hardcode expected hex values; drift is guarded by
      // design-tokens-coverage.spec and visual-token.spec.
      files: ['**/*.spec.ts', '**/*.spec.tsx'],
      rules: { 'no-restricted-syntax': 'off' },
    },
    {
      // Brand SVG source (protected) and grandfathered hex sites, fixed on touch.
      files: [
        'src/components/branding/bidplace-brand-svg.ts',
        'src/components/figma/FilterSheet.tsx',
        'src/features/sellers/AuthorShare.tsx',
        'src/features/sellers/product-draft-story.tsx',
        'src/app/(public)/dev/figma-buttons.tsx',
        // e2e probe holds expected rendered hexes for comparison.
        'e2e/support/figma-button-svg-probe.ts',
      ],
      rules: { 'no-restricted-syntax': 'off' },
    },
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
