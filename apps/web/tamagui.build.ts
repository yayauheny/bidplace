import type { TamaguiBuildOptions } from 'tamagui';

const config: TamaguiBuildOptions = {
  config: './tamagui.config.ts',
  components: ['tamagui'],
  outputCSS: './public/tamagui.generated.css',
  disableExtraction: process.env.NODE_ENV === 'development',
};

export default config;
