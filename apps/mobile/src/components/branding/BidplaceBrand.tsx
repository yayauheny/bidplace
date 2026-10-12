import { Platform, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { designTokens } from '@bidplace/design-tokens';

import { BIDPLACE_PAGE_LOGO_SIZE } from './bidplace-brand-metrics';
import { BIDPLACE_MARK_SVG, BIDPLACE_WORDMARK_SVG } from './bidplace-brand-svg';

export { BIDPLACE_PAGE_LOGO_SIZE };

type DecorativeBrandWebStyle = ViewStyle & {
  userSelect: 'none';
  WebkitUserSelect: 'none';
};

const decorativeBrandWebStyle: DecorativeBrandWebStyle = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

const decorativeSvgProps = Platform.OS === 'web'
  ? { 'aria-hidden': true, style: decorativeBrandWebStyle }
  : { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const };

export function BidplaceMark({
  size = designTokens.auth.markSize,
}: {
  size?: number;
}) {
  return (
    <SvgXml
      testID="bidplace-brand-mark"
      xml={BIDPLACE_MARK_SVG}
      width={size}
      height={size}
      {...decorativeSvgProps}
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
      testID="bidplace-brand-wordmark"
      xml={BIDPLACE_WORDMARK_SVG}
      width={width}
      height={height}
      {...decorativeSvgProps}
    />
  );
}
