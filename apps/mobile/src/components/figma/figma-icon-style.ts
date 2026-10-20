import { designTokens } from '@bidplace/design-tokens';

import { type FigmaIconName } from './figma-icon-names';

const heavyIconNames = new Set<FigmaIconName>([
  'filter-horizontal',
  'arrow-up-down',
]);

export function figmaIconStrokeWidth(name: FigmaIconName, size: number) {
  if (size >= designTokens.size.dockIcon) {
    return designTokens.stroke.dockIcon;
  }
  return heavyIconNames.has(name)
    ? designTokens.stroke.iconHeavy
    : designTokens.stroke.icon;
}
