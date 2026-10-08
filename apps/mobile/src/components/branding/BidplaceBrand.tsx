import { SvgXml } from 'react-native-svg';

import { designTokens } from '@bidplace/design-tokens';

import { BIDPLACE_PAGE_LOGO_SIZE } from './bidplace-brand-metrics';
import { BIDPLACE_MARK_SVG, BIDPLACE_WORDMARK_SVG } from './bidplace-brand-svg';

export { BIDPLACE_PAGE_LOGO_SIZE };

export function BidplaceMark({
  size = designTokens.auth.markSize,
}: {
  size?: number;
}) {
  return (
    <SvgXml
      xml={BIDPLACE_MARK_SVG}
      width={size}
      height={size}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export function BidplaceWordmark({
  width = designTokens.auth.wordmarkWidth,
  height = designTokens.auth.wordmarkHeight,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <SvgXml
      xml={BIDPLACE_WORDMARK_SVG}
      width={width}
      height={height}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
