import { ScrollView, View } from 'react-native';

import {
  figmaButtonMatrixCell,
  figmaButtonVariants,
  figmaButtonTokens,
} from '@bidplace/design-tokens';

import { FigmaButton } from '../../../components/figma/FigmaButton';
import { AppText } from '../../../components/ui';

const sampleLabel = figmaButtonTokens.metrics.sampleLabel;

function variantMatrixNote(variant: (typeof figmaButtonVariants)[number]) {
  const idle = figmaButtonMatrixCell(variant, 'idle');
  return `${variant} idle fill ${idle.fill}`;
}

export default function FigmaButtonsDevStand() {
  return (
    <ScrollView
      nativeID="figma-button-matrix-stand"
      contentContainerStyle={{
        padding: 24,
        gap: 28,
        alignItems: 'flex-start',
      }}
    >
      <AppText role="sectionTitle">FigmaButton matrix stand</AppText>
      <AppText role="caption" testID="figma-button-stand-note">
        Unlinked dev route. Exercise hover, mouse hold, keyboard activation, and
        disabled states per variant.
      </AppText>

      {figmaButtonVariants.map((variant) => (
        <View
          key={variant}
          nativeID={`figma-button-stand-${variant}`}
          style={{ gap: 10, alignItems: 'flex-start' }}
        >
          <AppText role="metadata">{variantMatrixNote(variant)}</AppText>
          <FigmaButton
            testID={`figma-button-${variant}-idle`}
            label={sampleLabel}
            variant={variant}
            onPress={() => undefined}
          />
          <FigmaButton
            testID={`figma-button-${variant}-disabled`}
            label={`${sampleLabel} disabled`}
            variant={variant}
            disabled
            onPress={() => undefined}
          />
        </View>
      ))}

      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        <AppText role="metadata">loading</AppText>
        <FigmaButton
          testID="figma-button-solid-loading"
          label="Загрузка"
          variant="solid"
          loading
          onPress={() => undefined}
        />
      </View>

      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        <AppText role="metadata">icon</AppText>
        <FigmaButton
          testID="figma-button-solid-icon"
          label="С иконкой"
          variant="solid"
          icon="copy"
          onPress={() => undefined}
        />
      </View>

      <View style={{ gap: 10, alignItems: 'flex-start' }}>
        <AppText role="metadata">href link</AppText>
        <FigmaButton
          testID="figma-button-outline-link"
          label="Модерация"
          variant="outline"
          href="/admin"
        />
      </View>
    </ScrollView>
  );
}
