import { type ReactNode } from 'react';
import { Image as LocalPreviewImage, View } from 'react-native';
import { Line, Svg } from 'react-native-svg';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import {
  AppText,
  PrimaryButton,
  ResilientRemoteImage,
} from '../../components/ui';
import { AuthorApplicationStepShell } from './author-application-step-shell';

// Geometry of the basic-information frame (Figma 527:16416, 390 px wide). Each value is used by one element only.
const photoWidth = 135.3;
const photoHeight = 180.4;
const photoRadius = 18.12;
const photoIconSize = 65.23;
const photoIconStrokePx = 2.42;
const photoGuideStrokePx = 0.72;
const photoGuideHorizontalY = [35.03, 146.17];
const photoGuideVerticalX = [12.08, 123.22];

export type AuthorApplicationPhoto = {
  /** Local data URI for a just-picked photo, remote asset URL for the saved one, or null. */
  uri: string | null;
  local: boolean;
  failed: boolean;
  disabled: boolean;
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
}: {
  closeDisabled: boolean;
  onClose: () => void;
  photo: AuthorApplicationPhoto;
  fields: ReactNode;
  formAlert: ReactNode;
  action: ReactNode;
  footer: ReactNode;
}) {
  return (
    <AuthorApplicationStepShell
      profileStep={1}
      closeDisabled={closeDisabled}
      onClose={onClose}
      headerToBodyGap={designTokens.authorApplication.headerToBodyBasics}
      title="Основная информация"
      subtitle="Город можно не указывать"
      footer={footer}
    >
      <View style={{ gap: 32 }}>
        <AuthorPhotoBlock photo={photo} />
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
  const uri = photo.failed ? null : photo.uri;
  const hasPhoto = uri !== null;
  return (
    <View style={{ gap: 12 }}>
      <AppText role="formLabel" tone="strong" style={{ textAlign: 'center' }}>
        Фото профиля
      </AppText>
      <View style={{ gap: 14 }}>
        <View
          style={{
            alignSelf: 'center',
            width: photoWidth,
            height: photoHeight,
            borderRadius: photoRadius,
            backgroundColor: designTokens.color.mutedFill,
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
                color={designTokens.color.inkStrong}
              />
            </>
          )}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <PrimaryButton
            label={hasPhoto ? 'Изменить фото' : 'Загрузить фото'}
            disabled={photo.disabled}
            alignSelf="center"
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
  return (
    <Svg
      width={photoWidth}
      height={photoHeight}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {photoGuideHorizontalY.map((y) => (
        <Line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={photoWidth}
          y2={y}
          stroke={designTokens.color.photoGuide}
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
          stroke={designTokens.color.photoGuide}
          strokeWidth={photoGuideStrokePx}
        />
      ))}
    </Svg>
  );
}
