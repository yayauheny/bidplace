import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';
import { AppText } from '../ui/AppText';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';

/**
 * Account header identity (Figma account screen): row — avatar100 слева,
 * текстовая колонка (flex1/minWidth0) справа со слотом CTA. Не
 * CreatorIdentity: та настроена на публичные страницы автора.
 */
export function AccountIdentity({
  name,
  handle,
  photoUrl,
  imageLabel,
  cta,
}: {
  name: string;
  handle: string | null;
  photoUrl: string | null;
  imageLabel: string;
  /** Header CTA живёт в правой колонке (Figma solid matrix). */
  cta?: React.ReactNode;
}) {
  const palette = useAppTheme();
  const avatarSize = designTokens.size.accountAvatar;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: designTokens.space.x2,
        alignItems: 'center',
      }}
    >
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
            fallback="plain"
            style={{ width: avatarSize, height: avatarSize }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}>
        <AppText role="accountName" tone="strong">
          {name}
        </AppText>
        {handle ? (
          <AppText
            role="accountHandle"
            style={{ color: palette.accountMeta }}
          >{`@${handle}`}</AppText>
        ) : null}
        {cta}
      </View>
    </View>
  );
}
