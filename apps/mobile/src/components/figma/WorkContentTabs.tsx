import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import {
  getWorkContentTabAt,
  resolveWorkContentTab,
  visibleWorkContentTabs,
  type WorkContentTabId,
} from './work-content-tabs';

type FocusableTab = { focus?: () => void };

export function WorkContentTabs({
  activeTab,
  hasStory,
  onChange,
}: {
  activeTab: WorkContentTabId;
  hasStory: boolean;
  onChange: (tab: WorkContentTabId) => void;
}) {
  const tabs = visibleWorkContentTabs(hasStory);
  const selectedTab = resolveWorkContentTab(activeTab, hasStory);
  const refs = useRef<Array<FocusableTab | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const selectAt = useCallback(
    (index: number) => {
      onChange(getWorkContentTabAt(index, hasStory));
      refs.current[(index + tabs.length) % tabs.length]?.focus?.();
    },
    [hasStory, onChange, tabs.length],
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
        selectAt(tabs.length - 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, selectAt, tabs.length]);

  if (tabs.length <= 1) return null;

  return (
    <View
      role="tablist"
      accessibilityRole="tablist"
      accessibilityLabel="Разделы страницы работы"
      style={{
        width: '100%',
        flexDirection: 'row',
        gap: figmaTokens.space.x5,
        borderBottomWidth: 1,
        borderBottomColor: figmaTokens.color.divider,
      }}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === selectedTab;
        return (
          <MotionPressable
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node as unknown as FocusableTab | null;
            }}
            nativeID={`work-tab-${tab.id}`}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            aria-controls={`work-panel-${tab.id}`}
            onBlur={() => setFocusedIndex(null)}
            onFocus={() => setFocusedIndex(index)}
            onPress={() => onChange(tab.id)}
            preset="button"
            style={{
              minHeight: figmaTokens.size.touch,
              justifyContent: 'center',
              borderBottomWidth: selected ? 2 : 0,
              borderBottomColor: figmaTokens.color.ink,
            }}
            interactionStyle={({ hovered }) => ({
              opacity: hovered || selected ? 1 : 0.72,
            })}
          >
            <AppText role="label" tone={selected ? 'default' : 'muted'}>
              {tab.label}
            </AppText>
          </MotionPressable>
        );
      })}
    </View>
  );
}
