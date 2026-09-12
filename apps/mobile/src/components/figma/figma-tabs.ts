export type FigmaTab = { value: string; label: string; count?: number };
export type FigmaTabsProps = {
  tabs: readonly FigmaTab[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  panelId: string;
};
