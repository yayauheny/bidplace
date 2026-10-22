const { createHash } = require('node:crypto');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo inlines public build values. Different local API builds must not reuse
// transforms compiled for the previous target (the same applies to release flags).
const publicBuildValues = [
  process.env.EXPO_PUBLIC_API_URL,
  process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY,
  process.env.EXPO_PUBLIC_APP_ENV,
  process.env.EXPO_PUBLIC_ANALYTICS_ENABLED,
];
config.cacheVersion = `${config.cacheVersion ?? ''}:${createHash('sha256').update(JSON.stringify(publicBuildValues)).digest('hex')}`;

// W4: dev-only route must not ship in production/staging bundles at all (route + module).
// Same signal as scripts/cloudflare/build-web.mjs; dev servers leave EXPO_PUBLIC_APP_ENV unset.
if (['production', 'staging'].includes(process.env.EXPO_PUBLIC_APP_ENV)) {
  config.resolver.blockList = [
    ...(config.resolver.blockList ?? []),
    /src\/app\/\(public\)\/dev\/figma-buttons\.tsx$/,
  ];
}

module.exports = config;
