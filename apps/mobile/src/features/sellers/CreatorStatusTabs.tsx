import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import type { PublicListingStatus } from '@bidplace/contracts';

import { AppText, MotionPressable } from '../../components/ui';

const statusTabs: Array<{ value: PublicListingStatus; label: string }> = [
  { value: 'LIVE', label: 'Идут торги' },
  { value: 'SCHEDULED', label: 'Запланированы' },
  { value: 'ENDED', label: 'Завершены' },
];

export type CreatorStatusTabsProps = {
  status?: PublicListingStatus;
  statusCounts: Record<PublicListingStatus, number>;
  onChange: (status?: PublicListingStatus) => void;
};

export function CreatorStatusTabs({
  status,
  statusCounts,
  onChange,
}: CreatorStatusTabsProps) {
  return (
    <View
      role="tablist"
      accessibilityLabel="Статусы работ автора"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: designTokens.space.x2,
      }}
    >
      {statusTabs.map((tab) => {
        const selected = tab.value === status;
        return (
          <MotionPressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            aria-controls="creator-works-panel"
            onPress={() => onChange(selected ? undefined : tab.value)}
            preset="button"
            style={{
              minHeight: 40,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 20,
              backgroundColor: selected
                ? designTokens.color.action
                : designTokens.color.surface,
              borderWidth: selected ? 0 : 1,
              borderColor: designTokens.color.border,
              paddingHorizontal: 17,
            }}
          >
            <AppText
              role="label"
              style={{
                color: selected
                  ? designTokens.color.surface
                  : designTokens.color.ink,
              }}
            >
              {tab.label}
            </AppText>
            <View
              style={{
                minWidth: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: selected
                  ? designTokens.color.surfaceStrong
                  : designTokens.color.surfaceMuted,
                paddingHorizontal: 6,
              }}
            >
              <AppText
                role="metadata"
                style={{
                  color: selected
                    ? designTokens.color.ink
                    : designTokens.color.textSecondary,
                }}
              >
                {statusCounts[tab.value]}
              </AppText>
            </View>
          </MotionPressable>
        );
      })}
    </View>
  );
}

