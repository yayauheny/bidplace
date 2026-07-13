import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from './tokens';

export type AppThemePalette = {
  [Key in keyof typeof lightTheme]: string;
};

export function useAppThemePalette(): AppThemePalette {
  const colorScheme = useColorScheme();

  return (colorScheme === 'dark' ? darkTheme : lightTheme) as AppThemePalette;
}
