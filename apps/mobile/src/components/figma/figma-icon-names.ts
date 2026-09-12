export const figmaIconNames = [
  'filter-horizontal',
  'arrow-up-down',
  'search-01',
  'delete-02',
  'x',
  'arrow-left-01',
  'arrow-right-01',
  'arrow-up-01',
  'arrow-down-01',
  'plus',
  'minus',
  'copy',
  'share-04',
  'qr-code-01',
  'lock-keyhole',
  'clock-04',
  'telegram',
  'instagram',
  'google',
  'eye-off',
  'view',
  'at-sign',
  'image-01',
  'calendar-01',
  'ai-magic',
  'user',
  'shopping-basket-01',
] as const;

export type FigmaIconName = (typeof figmaIconNames)[number];

/** Present in Figma, not rendered on First MVP surfaces. */
export const figmaDeferredIconNames = [
  'google',
  'ai-magic',
  'shopping-basket-01',
] as const satisfies ReadonlyArray<FigmaIconName>;
