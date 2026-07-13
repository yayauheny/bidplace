/* eslint-disable @typescript-eslint/no-empty-object-type */
import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

import { darkTheme, lightTheme } from './src/theme/tokens';

const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
  },
});

export default config;

export type Conf = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
