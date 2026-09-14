import type { PortfolioWorkDetailResponse } from '../../lib/portfolio-types';
import type { FigmaTab } from '../../components/figma/figma-tabs';
export type CreatorHeaderProps = {
  profile: PortfolioWorkDetailResponse['author'];
  tabs: readonly FigmaTab[];
  tab: string;
  onTabChange: (value: string) => void;
  panelId: string;
};
