import { designTokens } from '@bidplace/design-tokens';

export type FigmaTab = { value: string; label: string; count?: number };
export type FigmaTabsProps = {
  tabs: readonly FigmaTab[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  panelId: string;
  align?: 'start' | 'center';
  contentInset?: number;
  /** Таб-бар с фоном canvas и разделителем (веб-шапка). */
  fill?: boolean;
};

export function figmaTabLabelColor(selected: boolean) {
  return selected ? designTokens.color.ink : designTokens.color.tabInactive;
}
