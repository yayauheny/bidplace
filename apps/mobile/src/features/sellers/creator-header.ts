import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import type { FigmaTab } from '../../components/figma/figma-tabs';
export type CreatorHeaderProps = {
  profile: PortfolioWorkDetailResponse['author'];
  onBack: () => void;
  tabs: readonly FigmaTab[];
  tab: string;
  onTabChange: (value: string) => void;
  panelId: string;
};
