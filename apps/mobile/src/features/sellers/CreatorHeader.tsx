import { useState } from 'react';
import { Link } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { figmaIconButtonStyle } from '../../components/figma/figma-icon-button-style';
import { AppText, MotionPressable } from '../../components/ui';
import { AuthorShare } from './AuthorShare';
import { CreatorIdentity } from './CreatorIdentity';
import type { CreatorHeaderProps } from './creator-header';

export function CreatorHeader({
  profile,
  onBack,
  tabs,
  tab,
  onTabChange,
  panelId,
  isOwner = false,
  onUnavailable,
}: CreatorHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <View testID="creator-static-header">
      <View
        testID="author-header"
        style={{ paddingTop: designTokens.space.x3 }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',

            marginBottom: designTokens.space.x5,
          }}
        >
          <View testID="author-back">
            <FigmaIconButton
              icon="arrow-left-01"
              iconSize={20}
              strokeWidthPx={1.5}
              surface="muted"
              label="Назад"
              onPress={onBack}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FigmaIconButton
              icon="heart"
              iconSize={20}
              strokeWidthPx={1.5}
              surface="muted"
              label="Добавить автора в избранное"
              onPress={() => onUnavailable('Избранные авторы')}
            />
            <AuthorShare
              sharePath={profile.sharePath}
              onUnavailable={onUnavailable}
            />
            {isOwner ? (
              <Link href="/profile" asChild>
                <MotionPressable
                  accessibilityRole="link"
                  accessibilityLabel="Редактировать профиль автора"
                  preset="icon"
                  style={({ pressed }) =>
                    figmaIconButtonStyle(pressed, 'muted')
                  }
                >
                  <FigmaIcon name="pencil-edit-01" size={20} />
                </MotionPressable>
              </Link>
            ) : null}
            <FigmaIconButton
              icon="more-vertical"
              iconSize={20}
              strokeWidthPx={1.5}
              surface="muted"
              label="Действия с профилем"
              onPress={() => setMenuOpen(true)}
            />
          </View>
        </View>
        <CreatorIdentity
          profile={profile}
          onSubscribe={() => onUnavailable('Подписка на авторов')}
        />
      </View>
      <FigmaTabs
        tabs={tabs}
        value={tab}
        onChange={onTabChange}
        label="Профиль автора"
        panelId={panelId}
        align="center"
      />
      <FilterSheet
        presentation="compact"
        title="Действия"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="QR-код профиля"
          onPress={() => {
            setMenuOpen(false);
            setQrOpen(true);
          }}
          preset="button"
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <AppText role="bodySmall">QR-код профиля</AppText>
          <FigmaIcon name="qr-code-01" size={20} />
        </MotionPressable>
      </FilterSheet>
      <ShareSheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        sharePath={profile.sharePath}
      />
    </View>
  );
}
