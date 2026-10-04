import type { ReactNode } from 'react';
import type { Href } from 'expo-router';

import type { FigmaTab } from '../../components/figma/figma-tabs';

export const WORK_SCROLL_TEST_ID = 'product-scroll-view';

export type WorkHeaderImage = { id: string; url: string; full?: { url: string; width: number | null; height: number | null } };

export type WorkHeaderProps = {
  images: readonly [WorkHeaderImage, ...WorkHeaderImage[]];
  title: string;
  authorName: string;
  authorHref: Href;
  chips: readonly string[];
  tabs: readonly FigmaTab[];
  tab: string;
  onTabChange: (value: string) => void;
  panelId: string;
  onBack: () => void;
  onShare: () => void;
  children?: ReactNode;
};
