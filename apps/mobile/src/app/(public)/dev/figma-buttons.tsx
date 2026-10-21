import { ScrollView, View } from 'react-native';

import {
  figmaButtonInteractions,
  figmaButtonTokens,
  figmaButtonVariants,
} from '@bidplace/design-tokens';

import {
  FigmaButton,
  FigmaButtonStatePreview,
} from '../../../components/figma/FigmaButton';
import { AppText } from '../../../components/ui';
import { useAppTheme } from '../../../providers/theme-provider';
import type {
  FigmaButtonInteraction,
  FigmaButtonVariant,
} from '../../../components/figma/figma-button-style';

const sampleLabel = figmaButtonTokens.metrics.sampleLabel;

export const figmaButtonMatrixBoard = {
  width: 714,
  height: 283,
  columnX: [20, 193, 366, 539],
  rowY: [20, 82, 144, 206],
  rowLabelWidth: 132,
  columnHeaderHeight: 28,
} as const;

const variantRowLabels: Record<FigmaButtonVariant, string> = {
  solid: 'Черная',
  outline: 'Обводка',
  ghost: 'Без обводки',
  muted: 'Серая',
};

const interactionColumnLabels: Record<FigmaButtonInteraction, string> = {
  idle: 'Обычное',
  hover: 'Наведение',
  pressed: 'Нажатие',
  disabled: 'Недоступно',
};

function previewAccessibilityLabel(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return `Кнопка: ${variantRowLabels[variant]}, ${interactionColumnLabels[interaction]}`;
}

function FigmaButtonStateMatrix() {
  const palette = useAppTheme();
  const { rowLabelWidth, columnHeaderHeight, width, height, columnX, rowY } =
    figmaButtonMatrixBoard;
  const sampleHeight = figmaButtonTokens.metrics.sampleHeight;

  return (
    <View
      testID="figma-button-state-matrix"
      style={{ gap: 8, alignSelf: 'stretch' }}
    >
      <AppText role="sectionTitle">Матрица состояний</AppText>
      <AppText role="caption">
        Статичное превью всех 16 ячеек по handoff 292:5058; ниже — живые
        контролы.
      </AppText>
      <ScrollView
        horizontal
        testID="figma-button-state-matrix-scroll"
        showsHorizontalScrollIndicator
        keyboardShouldPersistTaps="handled"
        tabIndex={0}
        contentContainerStyle={{ paddingBottom: 4 }}
      >
        <View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: rowLabelWidth }} />
            <View
              style={{
                width,
                height: columnHeaderHeight,
                position: 'relative',
              }}
            >
              {figmaButtonInteractions.map((interaction, index) => (
                <View
                  key={interaction}
                  testID={`figma-button-matrix-header-${interaction}`}
                  style={{
                    position: 'absolute',
                    left: columnX[index],
                    top: 0,
                    height: columnHeaderHeight,
                    justifyContent: 'center',
                  }}
                >
                  <AppText role="metadata">
                    {interactionColumnLabels[interaction]}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                width: rowLabelWidth,
                height,
                position: 'relative',
              }}
            >
              {figmaButtonVariants.map((variant, index) => (
                <View
                  key={variant}
                  testID={`figma-button-matrix-row-label-${variant}`}
                  style={{
                    position: 'absolute',
                    top: rowY[index],
                    left: 0,
                    width: rowLabelWidth - 12,
                    height: sampleHeight,
                    justifyContent: 'center',
                  }}
                >
                  <AppText role="metadata">{variantRowLabels[variant]}</AppText>
                </View>
              ))}
            </View>
            <View
              testID="figma-button-matrix-board"
              style={{
                width,
                height,
                backgroundColor: palette.canvas,
                position: 'relative',
              }}
            >
              {figmaButtonVariants.map((variant, rowIndex) =>
                figmaButtonInteractions.map((interaction, columnIndex) => (
                  <View
                    key={`${variant}-${interaction}`}
                    style={{
                      position: 'absolute',
                      left: columnX[columnIndex],
                      top: rowY[rowIndex],
                    }}
                  >
                    <FigmaButtonStatePreview
                      variant={variant}
                      interaction={interaction}
                      label={sampleLabel}
                      accessibilityLabel={previewAccessibilityLabel(
                        variant,
                        interaction,
                      )}
                    />
                  </View>
                )),
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function FigmaButtonsDevStand() {
  // Dev-only stand: production web builds set EXPO_PUBLIC_APP_ENV (scripts/cloudflare/build-web.mjs).
  if (
    process.env.EXPO_PUBLIC_APP_ENV === 'production' ||
    process.env.EXPO_PUBLIC_APP_ENV === 'staging'
  ) {
    return null;
  }
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
        Unlinked dev route. Static board shows all 16 matrix cells; live
        controls below exercise hover, mouse hold, keyboard activation, and
        disabled states.
      </AppText>

      <FigmaButtonStateMatrix />

      <AppText role="sectionTitle">Интерактивные контролы</AppText>

      {figmaButtonVariants.map((variant) => (
        <View
          key={variant}
          nativeID={`figma-button-stand-${variant}`}
          style={{ gap: 10, alignItems: 'flex-start' }}
        >
          <AppText role="metadata">{variant}</AppText>
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
