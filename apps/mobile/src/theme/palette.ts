// Light-only palette hook.
// MVP uses a single light theme; dark mode is not implemented.
// Future: replace this with a context-provided token map.
import { lightTheme } from '@bidplace/design-tokens';

export function useAppThemePalette() {
  return lightTheme;
}
