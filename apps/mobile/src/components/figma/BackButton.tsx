import { designTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
import { FigmaGlassSurface } from './FigmaGlassSurface';
import { FigmaIcon } from './FigmaIcon';
import { FigmaIconButton } from './FigmaIconButton';

/**
 * Единая кнопка «Назад». Три визуальных варианта, выточенные под фигму:
 * - glass — страница работы (стеклянная плашка поверх медиа);
 * - muted — шапка автора (приглушённая поверхность);
 * - chrome — визард заявки автора (сырой глиф в квадрате chromeFrame).
 */
export function BackButton({
  onPress,
  label = 'Назад',
  variant,
  disabled = false,
}: {
  onPress: () => void;
  label?: string;
  variant: 'glass' | 'muted' | 'chrome';
  disabled?: boolean;
}) {
  const palette = useAppTheme();
  if (variant === 'glass') {
    return (
      <FigmaGlassSurface
        preset="controlGroup"
        contentStyle={{ padding: designTokens.space.socialGroupY }}
      >
        <FigmaIconButton
          icon="arrow-left-01"
          iconSize={designTokens.size.socialGroupIcon}
          label={label}
          onPress={onPress}
        />
      </FigmaGlassSurface>
    );
  }
  if (variant === 'muted') {
    return (
      <FigmaIconButton
        icon="arrow-left-01"
        iconSize={20}
        strokeWidthPx={1.5}
        surface="muted"
        label={label}
        onPress={onPress}
      />
    );
  }
  const chrome = designTokens.authorApplication;
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={(designTokens.size.touch - chrome.chromeFrame) / 2}
      onPress={onPress}
      preset="icon"
      style={{
        width: chrome.chromeFrame,
        height: chrome.chromeFrame,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FigmaIcon
        name="arrow-left-01"
        size={chrome.chromeGlyph}
        strokeWidthPx={chrome.chromeStroke}
        color={palette.inkStrong}
      />
    </MotionPressable>
  );
}
