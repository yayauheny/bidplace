import { Image } from 'expo-image';

import logo from '../../../assets/branding/bidplace-logo-full.svg';

// Exact combined brand from Figma5065:20532; never crop a wordmark to fill its box.
const aspectRatio = 484 / 92.455;

export function BidplaceLogo({ width }: { width: number }) {
  return (
    <Image
      testID="bidplace-logo"
      source={logo}
      accessible={false}
      contentFit="contain"
      style={{ width, maxWidth: '100%', aspectRatio, flexShrink: 0 }}
    />
  );
}
