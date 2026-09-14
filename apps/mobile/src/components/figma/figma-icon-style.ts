import { figmaTokens } from '@bidplace/design-tokens';

import { type FigmaIconName } from './figma-icon-names';

const heavyIconNames = new Set<FigmaIconName>([
  'filter-horizontal',
  'arrow-up-down',
]);

export function figmaIconStrokeWidth(name: FigmaIconName, size: number) {
  if (size >= figmaTokens.size.dockIcon) {
    return figmaTokens.stroke.dockIcon;
  }
  return heavyIconNames.has(name)
    ? figmaTokens.stroke.iconHeavy
    : figmaTokens.stroke.icon;
}
