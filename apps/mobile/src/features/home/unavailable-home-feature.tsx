import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, navigateBack } from '../../components/layout';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { PageHeader, PageState } from '../../components/ui';

export function UnavailableHomeFeature({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const router = useRouter();

  return (
    <AppShell>
      <View
        style={{
          flex: 1,
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.x8,
          paddingBottom: designTokens.size.dockReserve,
          gap: designTokens.space.x6,
        }}
      >
        <FigmaButton
          label="Назад"
          icon="arrow-left-01"
          variant="ghost"
          onPress={() => navigateBack(router, { fallbackHref: '/' })}
        />
        <PageHeader title={title} />
        <PageState title="Пока недоступно" message={message} />
      </View>
    </AppShell>
  );
}
