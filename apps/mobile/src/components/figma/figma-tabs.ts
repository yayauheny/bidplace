import { figmaTokens } from '@bidplace/design-tokens';

export type FigmaTab = { value: string; label: string; count?: number };
export type FigmaTabsProps = {
  tabs: readonly FigmaTab[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  panelId: string;
  align?: 'start' | 'center';
};

export function figmaTabLabelColor(selected: boolean) {
  return selected ? figmaTokens.color.ink : figmaTokens.color.tabInactive;
}
