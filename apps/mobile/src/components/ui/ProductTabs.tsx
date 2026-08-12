import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';
import {
  getProductTabAt,
  productTabs,
  type ProductTabId,
} from './product-tabs';

type FocusableTab = { focus?: () => void };

export function ProductTabs({
  activeTab,
  bidCount,
  onChange,
}: {
  activeTab: ProductTabId;
  bidCount?: number;
  onChange: (tab: ProductTabId) => void;
}) {
  const refs = useRef<Array<FocusableTab | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const selectAt = useCallback(
    (index: number) => {
      onChange(getProductTabAt(index));
      refs.current[
        (index + productTabs.length) % productTabs.length
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
        selectAt(productTabs.length - 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, selectAt]);

  return (
    <View
      role="tablist"
      accessibilityLabel="Разделы страницы предмета"
      style={{
        width: '100%',
        maxWidth: 430,
        height: 72,
        flexDirection: 'row',
        gap: 20,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.color.border,
      }}
    >
      {productTabs.map((tab, index) => {
        const selected = tab.id === activeTab;
        const accessibilityLabel =
          tab.id === 'bids' && bidCount !== undefined
            ? `${tab.label}, ${bidCount} ставок`
            : tab.label;
        return (
          <MotionPressable
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node as unknown as FocusableTab | null;
            }}
            nativeID={`product-tab-${tab.id}`}
            accessibilityRole="tab"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected }}
            aria-selected={selected}
            aria-controls={`product-panel-${tab.id}`}
            onBlur={() => setFocusedIndex(null)}
            onFocus={() => setFocusedIndex(index)}
            onPress={() => onChange(tab.id)}
            preset="button"
            style={{
              width: index === 0 ? 82 : index === 1 ? 122 : 100,
              minHeight: 72,
              justifyContent: 'center',
              alignItems: 'flex-start',
              borderBottomWidth: selected ? 2 : 0,
              borderBottomColor: designTokens.color.ink,
              paddingHorizontal: 0,
            }}
            interactionStyle={({ hovered }) => ({
              opacity: hovered || selected ? 1 : 0.72,
            })}
          >
            <AppText
              role="label"
              style={{ fontSize: 17, lineHeight: 22, fontWeight: '600' }}
            >
              {tab.label}
            </AppText>
          </MotionPressable>
        );
      })}
    </View>
  );
}
