import { designTokens } from '@bidplace/design-tokens';

export function figmaIconStrokeWidth(size: number) {
  return size >= designTokens.size.dockIcon
    ? designTokens.stroke.iconHeavy
    : designTokens.stroke.icon;
}
