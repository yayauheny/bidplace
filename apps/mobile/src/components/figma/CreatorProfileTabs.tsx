import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import {
  creatorProfileTabs,
  creatorWorksTabLabel,
  getCreatorProfileTabAt,
  type CreatorProfileTabId,
} from './creator-profile-tabs';

type FocusableTab = { focus?: () => void };

export function CreatorProfileTabs({
  activeTab,
  worksCount,
  onChange,
}: {
  activeTab: CreatorProfileTabId;
  worksCount: number;
  onChange: (tab: CreatorProfileTabId) => void;
}) {
  const refs = useRef<Array<FocusableTab | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const selectAt = useCallback(
    (index: number) => {
      onChange(getCreatorProfileTabAt(index));
      refs.current[
        (index + creatorProfileTabs.length) % creatorProfileTabs.length
      ]?.focus?.();
    },
    [onChange],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || focusedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        selectAt(focusedIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        selectAt(focusedIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        selectAt(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        selectAt(creatorProfileTabs.length - 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, selectAt]);

  return (
    <View
      role="tablist"
      accessibilityRole="tablist"
      accessibilityLabel="Разделы профиля автора"
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: figmaTokens.space.x2,
        borderBottomWidth: 1,
        borderBottomColor: figmaTokens.color.divider,
      }}
    >
      {creatorProfileTabs.map((tab, index) => {
        const selected = tab.id === activeTab;
        const label =
          tab.id === 'works' ? creatorWorksTabLabel(worksCount) : tab.label;

        return (
          <MotionPressable
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node as unknown as FocusableTab | null;
            }}
            nativeID={`creator-tab-${tab.id}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            aria-controls={`creator-panel-${tab.id}`}
            onBlur={() => setFocusedIndex(null)}
            onFocus={() => setFocusedIndex(index)}
            onPress={() => onChange(tab.id)}
            preset="button"
            style={{
              flex: 1,
              maxWidth: 160,
              minHeight: figmaTokens.size.touch,
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomWidth: selected ? 2 : 0,
              borderBottomColor: figmaTokens.color.ink,
            }}
            interactionStyle={({ hovered }) => ({
              opacity: hovered || selected ? 1 : 0.72,
            })}
          >
            <AppText
              role="label"
              tone={selected ? 'default' : 'muted'}
            >
              {label}
            </AppText>
          </MotionPressable>
        );
      })}
    </View>
  );
}
