/* eslint-disable @typescript-eslint/no-empty-object-type */
import { defaultConfig } from '@tamagui/config/v5';
import { createFont, createTamagui } from 'tamagui';

import { appMedia, darkTheme, fontFamilies, lightTheme } from './src/theme/tokens';

const bodyFont = createFont({
  family: fontFamilies.sansRegular,
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '600',
  },
  face: {
    400: { normal: fontFamilies.sansRegular },
    500: { normal: fontFamilies.sansMedium },
    600: { normal: fontFamilies.sansStrong },
    700: { normal: fontFamilies.sansStrong },
  },
});

const headingFont = createFont({
  family: fontFamilies.serifRegular,
  size: defaultConfig.fonts.heading.size,
  lineHeight: defaultConfig.fonts.heading.lineHeight,
  weight: {
    5: '500',
    6: '600',
    7: '600',
  },
  face: {
    500: { normal: fontFamilies.serifRegular },
    600: { normal: fontFamilies.serifStrong },
    700: { normal: fontFamilies.serifStrong },
  },
});

const config = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
    heading: headingFont,
  },
  media: {
    ...defaultConfig.media,
    mobile: { maxWidth: appMedia.mobileMax },
    tablet: { minWidth: appMedia.mobileMax + 1, maxWidth: appMedia.tabletMax },
    desktop: { minWidth: appMedia.desktopMin },
    wide: { minWidth: appMedia.wideMin },
  },
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
