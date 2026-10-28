import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import type { FigmaTab } from '../../components/figma/figma-tabs';
export type CreatorHeaderProps = {
  toolbar: ReactNode;
  scrollY: SharedValue<number>;
  profile: PortfolioWorkDetailResponse['author'];
  onBack: () => void;
  tabs: readonly FigmaTab[];
  tab: string;
  onTabChange: (value: string) => void;
  panelId: string;
  isOwner?: boolean;
  onUnavailable: (feature: string) => void;
};
