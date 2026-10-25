import type { SemanticColorMap } from '@bidplace/design-tokens';

export type FigmaTab = { value: string; label: string; count?: number };
export type FigmaTabsProps = {
  tabs: readonly FigmaTab[];
  variant?: 'underline' | 'segmented';
  value: string;
  onChange: (value: string) => void;
  label: string;
  panelId: string;
  align?: 'start' | 'center';
  selection?: boolean;
  contentInset?: number;
  /** Таб-бар с фоном canvas и разделителем (веб-шапка). */
  fill?: boolean;
};

export function figmaTabLabelColor(
  selected: boolean,
  palette: SemanticColorMap,
) {
  return selected ? palette.ink : palette.tabInactive;
}
