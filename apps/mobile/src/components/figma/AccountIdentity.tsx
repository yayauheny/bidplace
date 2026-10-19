import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';
import { AppText } from '../ui/AppText';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';

/**
 * Account header identity: 100px round avatar + name/@handle stack.
 * Deliberately not CreatorIdentity — that one is tuned for public author
 * pages; this composition follows the account-screen Figma tokens.
 */
export function AccountIdentity({
  name,
  handle,
  photoUrl,
  imageLabel,
}: {
  name: string;
  handle: string | null;
  photoUrl: string | null;
  imageLabel: string;
}) {
  const palette = useAppTheme();
  const avatarSize = designTokens.size.accountAvatar;

  return (
    <View style={{ alignItems: 'center', gap: designTokens.space.x3 }}>
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: designTokens.radius.avatar,
          overflow: 'hidden',
          backgroundColor: palette.accountAvatarPlaceholder,
        }}
      >
        {photoUrl ? (
          <ResilientRemoteImage
            uri={getApiAssetUrl(photoUrl)}
            component="AccountIdentity"
            accessibilityLabel={imageLabel}
            fallbackLabel={`Фото недоступно: ${name}`}
            retryable={false}
            style={{ width: avatarSize, height: avatarSize }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View style={{ alignItems: 'center', gap: designTokens.space.x1 }}>
        <AppText role="accountName" tone="strong">
          {name}
        </AppText>
        {handle ? (
          <AppText
            role="accountHandle"
            style={{ color: palette.gray2 }}
          >{`@${handle}`}</AppText>
        ) : null}
      </View>
    </View>
  );
}
