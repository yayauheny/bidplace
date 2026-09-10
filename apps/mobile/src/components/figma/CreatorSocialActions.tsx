import * as ExpoLinking from 'expo-linking';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppIcon } from '../ui/AppIcon';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaGlassSurface } from './FigmaGlassSurface';
import { FigmaIcon } from './FigmaIcon';
import {
  CREATOR_SOCIAL_GAP,
  CREATOR_SOCIAL_ICON_SIZE,
  CREATOR_SOCIAL_PAD_X,
  CREATOR_SOCIAL_PAD_Y,
  creatorSocialActionsVisible,
  presentCreatorSocials,
  type CreatorPublicLinks,
  type CreatorPublicSocialId,
} from './creator-social-actions';

export function CreatorSocialActions({
  telegramUrl,
  instagramUrl,
  websiteUrl,
  onShare,
}: CreatorPublicLinks & {
  onShare?: () => void;
}) {
  const links = { telegramUrl, instagramUrl, websiteUrl };
  const socials = presentCreatorSocials(links);
  const hasShare = typeof onShare === 'function';

  if (!creatorSocialActionsVisible(links, hasShare)) {
    return null;
  }

  return (
    <FigmaGlassSurface
      preset="controlGroup"
      style={{ alignSelf: 'center' }}
      contentStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: CREATOR_SOCIAL_GAP,
        paddingHorizontal: CREATOR_SOCIAL_PAD_X,
        paddingVertical: CREATOR_SOCIAL_PAD_Y,
      }}
    >
      {socials.map((social) => (
        <MotionPressable
          key={social.id}
          accessibilityRole="link"
          accessibilityLabel={social.label}
          hitSlop={8}
          preset="icon"
          onPress={() => {
            void ExpoLinking.openURL(social.href);
          }}
          style={{
            width: CREATOR_SOCIAL_ICON_SIZE,
            height: CREATOR_SOCIAL_ICON_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {socialIcon(social.id)}
        </MotionPressable>
      ))}
      {hasShare ? (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Поделиться профилем"
          hitSlop={8}
          preset="icon"
          onPress={onShare}
          style={{
            width: CREATOR_SOCIAL_ICON_SIZE,
            height: CREATOR_SOCIAL_ICON_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon
            name="share"
            size={CREATOR_SOCIAL_ICON_SIZE}
            color={figmaTokens.color.ink}
          />
        </MotionPressable>
      ) : null}
    </FigmaGlassSurface>
  );
}

function socialIcon(id: CreatorPublicSocialId) {
  if (id === 'telegram') {
    return (
      <FigmaIcon
        name="telegram"
        size={CREATOR_SOCIAL_ICON_SIZE}
        color={figmaTokens.color.ink}
      />
    );
  }

  return (
    <AppIcon
      name={id === 'instagram' ? 'instagram' : 'globe'}
      size={CREATOR_SOCIAL_ICON_SIZE}
      color={figmaTokens.color.ink}
    />
  );
}
