import * as ExpoLinking from 'expo-linking';
import { Platform } from 'react-native';

import { resolvePublicShareUrl } from './resolve-public-share-url';

export { resolvePublicShareUrl };

export function publicShareUrl(sharePath: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return resolvePublicShareUrl(sharePath, window.location.origin);
  }
  return ExpoLinking.createURL(sharePath.trim());
}
