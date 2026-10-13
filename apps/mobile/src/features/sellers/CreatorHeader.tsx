import { useState } from 'react';
import { Link } from 'expo-router';
import { Heart, MoreHorizontal, Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { AppDialog, AppText, MotionPressable, SecondaryButton } from '../../components/ui';
import { AuthorShare } from './AuthorShare';
import { CreatorIdentity } from './CreatorIdentity';
import type { CreatorHeaderProps } from './creator-header';

const controlStyle = {
  width: 42,
  height: 42,
  borderRadius: designTokens.radius.pill,
  backgroundColor: designTokens.color.headerControl,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

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

  return (
    <View testID="creator-static-header">
      <View testID="author-header" style={{ paddingTop: designTokens.space.x3 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: designTokens.space.pageGutter,
            marginBottom: designTokens.space.x5,
          }}
        >
          <View testID="author-back" style={controlStyle}>
            <FigmaIconButton icon="arrow-left-01" label="Назад" onPress={onBack} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.space.x1 }}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Добавить автора в избранное"
              onPress={() => onUnavailable('Избранные авторы')}
              preset="icon"
              style={controlStyle}
            >
              <Heart size={22} color={designTokens.color.ink} />
            </MotionPressable>
            <AuthorShare sharePath={profile.sharePath} onUnavailable={onUnavailable} />
            {isOwner ? (
              <Link href="/profile" asChild>
                <MotionPressable
                  accessibilityRole="link"
                  accessibilityLabel="Редактировать профиль автора"
                  preset="icon"
                  style={controlStyle}
                >
                  <Pencil size={21} color={designTokens.color.ink} />
                </MotionPressable>
              </Link>
            ) : null}
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Действия с профилем"
              onPress={() => setMenuOpen(true)}
              preset="icon"
              style={controlStyle}
            >
              <MoreHorizontal size={23} color={designTokens.color.ink} />
            </MotionPressable>
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
      <AppDialog presentation="sheet" title="Действия" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={{ gap: designTokens.space.x4 }}>
          {isOwner ? (
            <SecondaryButton label="Редактировать профиль" width="full" href="/profile" />
          ) : null}
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Пожаловаться на автора"
            onPress={() => {
              setMenuOpen(false);
              onUnavailable('Жалобы на профили');
            }}
            preset="button"
            style={{ minHeight: designTokens.size.touch, justifyContent: 'center' }}
          >
            <AppText role="bodySmall" tone="danger">Пожаловаться</AppText>
          </MotionPressable>
        </View>
      </AppDialog>
    </View>
  );
}
