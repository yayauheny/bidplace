import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppThemePalette } from './tokens';

export type { AppThemePalette } from './tokens';

export function useAppThemePalette(): AppThemePalette {
  const colorScheme = useColorScheme();

  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
