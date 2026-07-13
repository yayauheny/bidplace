import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@bidplace/api-client',
    '@bidplace/config',
    '@bidplace/contracts',
    '@bidplace/design-tokens',
    '@tamagui/config',
    '@tamagui/lucide-icons-2',
    '@tamagui/next-theme',
    '@tamagui/react-native-svg',
    'react-native',
    'react-native-svg',
    'react-native-web',
    'socket.io-client',
    'tamagui',
  ],
  experimental: {
    turbo: {
      resolveAlias: {
        'react-native$': 'react-native-web',
        'react-native-svg': '@tamagui/react-native-svg',
      },
    },
  },
};

export default nextConfig;
