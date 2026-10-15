const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// W4: dev-only route must not ship in production/staging bundles at all (route + module).
// Same signal as scripts/cloudflare/build-web.mjs; dev servers leave EXPO_PUBLIC_APP_ENV unset.
if (['production', 'staging'].includes(process.env.EXPO_PUBLIC_APP_ENV)) {
  config.resolver.blockList = [
    ...(config.resolver.blockList ?? []),
    /src\/app\/\(public\)\/dev\/figma-buttons\.tsx$/,
  ];
}

module.exports = config;
