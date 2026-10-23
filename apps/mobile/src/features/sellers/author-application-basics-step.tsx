import { type ReactNode } from 'react';
import { Image as LocalPreviewImage, View } from 'react-native';
import { Line, Svg } from 'react-native-svg';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { useAppTheme } from '../../providers/theme-provider';
import {
  AppText,
  PrimaryButton,
  ResilientRemoteImage,
} from '../../components/ui';
import { AuthorApplicationStepShell } from './author-application-step-shell';

// Figma5067:25914: portrait guides are local to this photo step.
const photoWidth = 177;
const photoHeight = 236;
const photoRadius = 22;
const photoIconSize = 40;
const photoIconStrokePx = 1.5;
const photoGuideStrokePx = 0.72;
const photoGuideHorizontalY = [45.83, 191.22];
const photoGuideVerticalX = [15.8, 161.2];

export type AuthorApplicationPhoto = {
  /** Local data URI for a just-picked photo, remote asset URL for the saved one, or null. */
  uri: string | null;
  local: boolean;
  failed: boolean;
  disabled: boolean;
  preparing?: boolean;
  onChoose: () => void;
  onFailed: () => void;
};

export function AuthorApplicationBasicsStep({
  closeDisabled,
  onClose,
  photo,
  fields,
  formAlert,
  action,
  footer,
  photoStep = false,
  onBack,
  backDisabled,
}: {
  closeDisabled: boolean;
  onClose: () => void;
  photo: AuthorApplicationPhoto;
  fields: ReactNode;
  formAlert: ReactNode;
  action: ReactNode;
  footer: ReactNode;
  photoStep?: boolean;
  onBack?: () => void;
  backDisabled?: boolean;
}) {
  return (
    <AuthorApplicationStepShell
      profileStep={photoStep ? 0 : 1}
      closeDisabled={closeDisabled}
      onClose={onClose}
      onBack={onBack}
      backDisabled={backDisabled}
      headerToBodyGap={
        photoStep
          ? designTokens.space.x5
          : designTokens.authorApplication.headerToBodyBasics
      }
      headerBlockGap={photoStep ? designTokens.space.x2 : undefined}
      titleRole={photoStep ? 'workTitle' : undefined}
      title={photoStep ? 'Фото профиля' : 'Основная информация'}
      subtitle={photoStep ? undefined : 'Город можно не указывать'}
      footer={footer}
    >
      <View style={{ gap: 32 }}>
        {photoStep ? <AuthorPhotoBlock photo={photo} /> : null}
        <View style={{ gap: designTokens.authorApplication.bodyFieldGap }}>
          {fields}
          {formAlert}
          {action}
        </View>
      </View>
    </AuthorApplicationStepShell>
  );
}

function AuthorPhotoBlock({ photo }: { photo: AuthorApplicationPhoto }) {
  const palette = useAppTheme();
  const uri = photo.failed ? null : photo.uri;
  const hasPhoto = uri !== null;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 14 }}>
        <View
          style={{
            alignSelf: 'center',
            width: photoWidth,
            maxWidth: '100%',
            aspectRatio: photoWidth / photoHeight,
            borderRadius: photoRadius,
            backgroundColor: palette.mutedFill,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uri !== null ? (
            photo.local ? (
              <LocalPreviewImage
                source={{ uri }}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
                onError={photo.onFailed}
              />
            ) : (
              <ResilientRemoteImage
                uri={uri}
                component="AuthorPhoto"
                accessibilityLabel="Фото профиля"
                fallbackLabel="Фото профиля недоступно"
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            )
          ) : (
            <>
              <PhotoGuides />
              <FigmaIcon
                name="image-add-02"
                size={photoIconSize}
                strokeWidthPx={photoIconStrokePx}
                color={palette.inkStrong}
              />
              <AppText role="body" style={{ marginTop: designTokens.space.x3 }}>
                Добавить фото
              </AppText>
            </>
          )}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <PrimaryButton
            label={hasPhoto ? 'Изменить фото' : 'Загрузить фото'}
            disabled={photo.disabled}
            alignSelf="center"
            loading={photo.preparing}
            onPress={photo.onChoose}
          />
          {hasPhoto ? null : (
            <AppText role="authLegal" tone="subdued" style={{ lineHeight: 15 }}>
              Разместите ваше лицо в центр линий
            </AppText>
          )}
        </View>
      </View>
    </View>
  );
}

function PhotoGuides() {
  const palette = useAppTheme();
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${photoWidth} ${photoHeight}`}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {photoGuideHorizontalY.map((y) => (
        <Line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={photoWidth}
          y2={y}
          stroke={palette.photoGuide}
          strokeWidth={photoGuideStrokePx}
        />
      ))}
      {photoGuideVerticalX.map((x) => (
        <Line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={photoHeight}
          stroke={palette.photoGuide}
          strokeWidth={photoGuideStrokePx}
        />
      ))}
    </Svg>
  );
}
